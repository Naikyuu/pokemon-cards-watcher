<script>
  import { creator } from "../stores/creator.js";
  import pokemon from "pokemontcgsdk";

  pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY || "" });

  let alts = [];
  let loading = false;
  let currentName = null;

  $: card = $creator.card;
  $: isCustom = !card.id || card.id.startsWith("custom");
  $: !isCustom && card.name && card.name !== currentName && fetchAlts(card.name);

  async function fetchAlts(name) {
    if (!name || loading) return;
    loading = true;
    currentName = name;
    alts = [];
    try {
      const result = await pokemon.card.where({
        q: `name:"${name}"`,
        orderBy: "-set.releaseDate",
        pageSize: 30,
        select: "id,name,number,images,rarity,subtypes,supertype,types,set",
      });
      // Exclure la carte actuelle
      alts = (result.data || [])
        .filter(c => c.id !== card.id)
        .map(c => ({ ...c, set: c.set?.id || c.set }));
    } catch(e) {}
    finally { loading = false; }
  }

  function selectAlt(c) {
    creator.setCardDataWithEffect({
      id: c.id,
      name: c.name,
      img: c.images?.large || c.images?.small || "",
      rarity: c.rarity || "Common",
      set: c.set,
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
</script>

{#if !isCustom && (loading || alts.length > 0)}
  <div class="alts-box">
    <div class="alts-header">
      <span class="alts-title">🎨 Autres artworks</span>
      {#if alts.length > 0}
        <span class="alts-count">{alts.length} version{alts.length > 1 ? "s" : ""}</span>
      {/if}
    </div>

    {#if loading}
      <div class="alts-loading">⏳ Recherche...</div>
    {:else}
      <div class="alts-grid">
        {#each alts as c (c.id)}
          <button
            class="alt-item"
            class:active={c.id === card.id}
            on:click={() => selectAlt(c)}
            title="{c.name} #{c.number} — {c.rarity || ''}"
          >
            <div class="alt-img">
              <img src={c.images?.small} alt={c.name} loading="lazy" />
            </div>
            <div class="alt-info">
              <span class="alt-rarity">{c.rarity || "—"}</span>
              <span class="alt-set">#{c.number}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .alts-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .alts-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
  }
  .alts-title { font-size: 13px; font-weight: bold; color: white; }
  .alts-count { font-size: 11px; color: rgba(255,255,255,0.3); }
  .alts-loading { font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; padding: 8px; }

  .alts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .alt-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.18s ease;
    min-width: 0;
  }
  .alt-item:hover {
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-2px);
    background: rgba(255,255,255,0.08);
  }
  .alt-item.active {
    border-color: var(--primary, #4dd9f0);
    background: rgba(77,217,240,0.08);
  }

  .alt-img { width: 100%; line-height: 0; }
  .alt-img img { width: 100%; height: auto; display: block; border-radius: 7px 7px 0 0; }

  .alt-info {
    padding: 4px 5px 5px;
    background: rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-radius: 0 0 7px 7px;
  }
  .alt-rarity {
    font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .alt-set { font-size: 8px; color: rgba(255,255,255,0.25); }
</style>
