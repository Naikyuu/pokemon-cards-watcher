<script>
  import { onMount } from "svelte";
  import { authStore, isLoggedIn } from "../stores/auth.js";
  import { fetchFavorites, toggleFavorite, isFavorite } from "../stores/cloudSync.js";
  import { creator } from "../stores/creator.js";

  export let onShowAuth = () => {};

  let favorites = [];
  let loading = false;
  let userId = null;

  $: authStore.subscribe(s => {
    userId = s.user?.id || null;
    if (userId) loadFavorites();
  });

  $: currentCardId = $creator.card.id;
  $: isFav = favorites.some(f => f.id === currentCardId);

  async function loadFavorites() {
    if (!userId) return;
    loading = true;
    const data = await fetchFavorites(userId);
    if (data) favorites = data;
    loading = false;
  }

  async function handleToggle() {
    if (!userId) { onShowAuth(); return; }
    const card = $creator.card;
    if (!card.id || card.id.startsWith("custom")) return;
    const added = await toggleFavorite(userId, card);
    if (added) {
      favorites = [{ ...card }, ...favorites];
    } else {
      favorites = favorites.filter(f => f.id !== card.id);
    }
  }

  function selectFav(fav) {
    creator.setCardDataWithEffect({
      id: fav.id, name: fav.name, img: fav.img,
      rarity: fav.rarity, set: fav.set, number: fav.number,
      types: fav.types || ["colorless"],
      supertype: fav.supertype || "pokémon",
      subtypes: fav.subtypes || ["Basic"],
    }, guessEffect(fav));
  }

  function guessEffect(c) {
    const r = (c.rarity || "").toLowerCase();
    const sub = (c.subtypes || []).join("").toLowerCase();
    if (r.includes("secret"))    return "secret-rare";
    if (r.includes("rainbow"))   return "rainbow-holo";
    if (r.includes("amazing"))   return "amazing-rare";
    if (r.includes("radiant"))   return "radiant-holo";
    if (r.includes("vmax") || sub.includes("vmax")) return "v-max";
    if (r.includes("vstar"))     return "v-star";
    if (r.includes("rare holo")) return "regular-holo";
    return "basic";
  }

  onMount(loadFavorites);
</script>

<div class="fav-box">
  <!-- Bouton ajouter/retirer favori -->
  {#if $creator.card.img && !$creator.card.id?.startsWith("custom")}
    <button
      class="fav-toggle"
      class:fav-toggle--active={isFav}
      on:click={handleToggle}
    >
      {isFav ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}
    </button>
  {/if}

  {#if !$isLoggedIn}
    <div class="fav-signin">
      <p>Connecte-toi pour sauvegarder tes favoris dans le cloud</p>
      <button class="btn-signin" on:click={onShowAuth}>👤 Se connecter</button>
    </div>
  {:else if loading}
    <div class="fav-loading">⏳ Chargement...</div>
  {:else if favorites.length === 0}
    <div class="fav-empty">
      <span>☆</span>
      <p>Aucun favori pour l'instant</p>
    </div>
  {:else}
    <div class="fav-header">
      <span class="fav-title">★ Favoris</span>
      <span class="fav-count">{favorites.length}</span>
    </div>
    <div class="fav-grid">
      {#each favorites as fav (fav.id)}
        <button
          class="fav-item"
          class:active={fav.id === currentCardId}
          on:click={() => selectFav(fav)}
          title={fav.name}
        >
          <div class="fav-img">
            <img src={fav.img} alt={fav.name} loading="lazy"/>
          </div>
          <div class="fav-info">
            <span class="fav-name">{fav.name}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fav-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }

  .fav-toggle {
    width: 100%; padding: 8px;
    background: rgba(255,215,0,0.06);
    border: 1px solid rgba(255,215,0,0.2);
    border-radius: 8px;
    color: rgba(255,215,0,0.6);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
  }
  .fav-toggle:hover { background: rgba(255,215,0,0.12); color: rgba(255,215,0,0.9); }
  .fav-toggle--active {
    background: rgba(255,215,0,0.15);
    border-color: rgba(255,215,0,0.4);
    color: #ffd700;
  }

  .fav-signin {
    text-align: center; display: flex; flex-direction: column;
    align-items: center; gap: 10px;
  }
  .fav-signin p { font-size: 13px; color: rgba(255,255,255,0.35); margin: 0; line-height: 1.5; }
  .btn-signin {
    padding: 8px 20px;
    background: linear-gradient(135deg, rgba(77,217,240,0.15), rgba(123,108,246,0.15));
    border: 1px solid rgba(77,217,240,0.3);
    border-radius: 8px; color: var(--primary,#4dd9f0);
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .btn-signin:hover { background: linear-gradient(135deg, rgba(77,217,240,0.25), rgba(123,108,246,0.25)); }

  .fav-loading { font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; padding: 8px; }
  .fav-empty { display:flex; flex-direction:column; align-items:center; gap:6px; color:rgba(255,255,255,0.2); padding:12px; }
  .fav-empty span { font-size:24px; }
  .fav-empty p { font-size:12px; margin:0; }

  .fav-header { display:flex; justify-content:space-between; align-items:center; }
  .fav-title { font-size:13px; font-weight:bold; color:white; }
  .fav-count { font-size:11px; color:rgba(255,255,255,0.3); }

  .fav-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
  }
  .fav-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 0; cursor: pointer;
    display: flex; flex-direction: column; overflow: hidden;
    transition: all 0.18s; min-width: 0;
  }
  .fav-item:hover { border-color: rgba(255,215,0,0.3); transform: translateY(-2px); }
  .fav-item.active { border-color: #ffd700; background: rgba(255,215,0,0.08); }
  .fav-img { width:100%; line-height:0; }
  .fav-img img { width:100%; height:auto; display:block; border-radius:7px 7px 0 0; }
  .fav-info { padding:4px 5px 5px; background:rgba(0,0,0,0.5); border-radius:0 0 7px 7px; }
  .fav-name { font-size:9px; color:white; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; }
</style>
