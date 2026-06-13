<script>
  import { creator } from "../stores/creator.js";
  import pokemon from "pokemontcgsdk";

  pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY || "" });

  let setCards = [];
  let loading = false;
  let currentSetId = null;
  let expanded = false;

  $: card = $creator.card;
  $: isCustom = !card.id || card.id.startsWith("custom");
  $: !isCustom && card.set && card.set !== currentSetId && fetchSetCards(card.set);

  async function fetchSetCards(setId) {
    if (!setId || loading) return;
    loading = true;
    currentSetId = setId;
    setCards = [];
    try {
      const result = await pokemon.card.where({
        q: `set.id:${setId}`,
        orderBy: "number",
        pageSize: 50,
        select: "id,name,number,images,rarity,subtypes,supertype,types,set",
      });
      setCards = (result.data || []).map(c => ({ ...c, set: c.set?.id || c.set }));
    } catch(e) {}
    finally { loading = false; }
  }

  function selectCard(c) {
    creator.setCardDataWithEffect({
      id: c.id,
      name: c.name,
      img: c.images?.large || c.images?.small || "",
      rarity: c.rarity || "Common",
      set: c.set || currentSetId,
      number: c.number || "001",
      types: c.types || ["colorless"],
      supertype: c.supertype?.toLowerCase() || "pokémon",
      subtypes: c.subtypes || ["Basic"],
    }, guessEffect(c));
  }

  function guessEffect(c) {
    const r = (c.rarity || "").toLowerCase();
    const sub = (c.subtypes || []).join("").toLowerCase();
    if (r.includes("secret"))    return "secret-rare";
    if (r.includes("rainbow"))   return "rainbow-holo";
    if (r.includes("amazing"))   return "amazing-rare";
    if (r.includes("radiant"))   return "radiant-holo";
    if (r.includes("cosmos"))    return "cosmos-holo";
    if (r.includes("vmax") || sub.includes("vmax")) return "v-max";
    if (r.includes("vstar"))     return "v-star";
    if (r.includes("rare ultra") || r.includes("rare holo v")) return "v-full-art";
    if (sub.includes(" v") && !sub.includes("vmax")) return "v-regular";
    if (r.includes("rare holo")) return "regular-holo";
    return "basic";
  }

  function getRarityDot(rarity = "") {
    const r = rarity.toLowerCase();
    if (r.includes("rainbow") || r.includes("secret")) return "#fbbf24";
    if (r.includes("ultra") || r.includes("vmax") || r.includes("vstar")) return "#60a5fa";
    if (r.includes("rare holo") || r.includes("amazing") || r.includes("radiant")) return "#a78bfa";
    if (r.includes("rare")) return "#4ade80";
    return "rgba(255,255,255,0.2)";
  }

  $: visibleCards = expanded ? setCards : setCards.slice(0, 12);
</script>

{#if !isCustom && (loading || setCards.length > 0)}
  <div class="setcards-box">
    <div class="setcards-header">
      <span class="setcards-title">🗂️ Autres cartes du set</span>
      {#if setCards.length > 0}
        <span class="setcards-count">{setCards.length} cartes</span>
      {/if}
    </div>

    {#if loading}
      <div class="setcards-loading">⏳ Chargement...</div>
    {:else}
      <div class="setcards-grid">
        {#each visibleCards as c (c.id)}
          <button
            class="setcard-item"
            class:active={c.id === card.id}
            on:click={() => selectCard(c)}
            title="{c.name} #{c.number} — {c.rarity || ''}"
          >
            <div class="setcard-img">
              <img src={c.images?.small} alt={c.name} loading="lazy" />
              <span class="rarity-dot" style="background:{getRarityDot(c.rarity)}"></span>
            </div>
            <span class="setcard-num">#{c.number}</span>
          </button>
        {/each}
      </div>

      {#if setCards.length > 12}
        <button class="expand-btn" on:click={() => expanded = !expanded}>
          {expanded ? "Voir moins ↑" : `Voir tout (${setCards.length}) ↓`}
        </button>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .setcards-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .setcards-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .setcards-title { font-size: 13px; font-weight: bold; color: white; }
  .setcards-count { font-size: 11px; color: rgba(255,255,255,0.3); }
  .setcards-loading { font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; padding: 8px; }

  .setcards-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 5px;
  }

  .setcard-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    overflow: hidden;
    transition: all 0.15s ease;
    min-width: 0;
    padding-bottom: 3px;
  }
  .setcard-item:hover {
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-2px);
    background: rgba(255,255,255,0.08);
  }
  .setcard-item.active {
    border-color: var(--primary, #4dd9f0);
    background: rgba(77,217,240,0.1);
    box-shadow: 0 0 8px rgba(77,217,240,0.2);
  }

  .setcard-img {
    width: 100%;
    position: relative;
    line-height: 0;
  }
  .setcard-img img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 5px 5px 0 0;
  }
  .rarity-dot {
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .setcard-num {
    font-size: 8px;
    color: rgba(255,255,255,0.3);
    text-align: center;
  }

  .expand-btn {
    width: 100%;
    margin-top: 8px;
    padding: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .expand-btn:hover { background: rgba(255,255,255,0.08); color: white; }
</style>
