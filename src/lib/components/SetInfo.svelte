<script>
  import pokemon from "pokemontcgsdk";
  import { creator } from "../stores/creator.js";

  pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY || "" });

  let setData = null;
  let loading = false;
  let error = false;

  $: setId = $creator.card.set;
  $: cardImg = $creator.card.img;
  $: cardId = $creator.card.id;

  // Reset si image locale
  $: {
    const isLocal = !cardId || cardId.startsWith("custom") || cardImg?.startsWith("data:");
    if (isLocal) { setData = null; error = false; loading = false; }
    else if (setId) { fetchSet(setId); }
  }

  async function fetchSet(id) {
    if (!id || id === "swsh1" && !$creator.card.id?.includes("-")) return;
    loading = true; error = false; setData = null;
    try {
      const result = await pokemon.set.find(id);
      setData = result;
    } catch(e) { error = true; }
    finally { loading = false; }
  }

  function formatDate(str) {
    if (!str) return "—";
    const [y, m, d] = str.split("/");
    const months = ["jan","fév","mar","avr","mai","juin","juil","aoû","sep","oct","nov","déc"];
    return `${d || "01"} ${months[(parseInt(m) || 1) - 1]} ${y}`;
  }
</script>

{#if loading}
  <div class="set-box set-box--loading">⏳ Infos set...</div>
{:else if setData}
  <div class="set-box">
    <div class="set-header">
      {#if setData.images?.logo}
        <img class="set-logo" src={setData.images.logo} alt={setData.name} />
      {:else}
        <span class="set-name-fallback">{setData.name}</span>
      {/if}
      {#if setData.images?.symbol}
        <img class="set-symbol" src={setData.images.symbol} alt="symbol" />
      {/if}
    </div>
    <div class="set-stats">
      <div class="set-stat">
        <span class="stat-label">Série</span>
        <span class="stat-value">{setData.series || "—"}</span>
      </div>
      <div class="set-stat">
        <span class="stat-label">Sortie</span>
        <span class="stat-value">{formatDate(setData.releaseDate)}</span>
      </div>
      <div class="set-stat">
        <span class="stat-label">Cartes</span>
        <span class="stat-value">{setData.printedTotal}<span class="stat-total">/{setData.total}</span></span>
      </div>
      <div class="set-stat">
        <span class="stat-label">Légal</span>
        <span class="stat-value">{setData.legalities?.standard === "Legal" ? "⚡ Standard" : setData.legalities?.expanded === "Legal" ? "🔄 Expanded" : "🚫 Retiré"}</span>
      </div>
    </div>
  </div>
{:else if error}
  <div class="set-box set-box--error">Set introuvable</div>
{/if}

<style>
  .set-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
    flex-shrink: 0;
  }
  .set-box--loading, .set-box--error {
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    text-align: center;
    padding: 8px;
  }
  .set-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 8px;
  }
  .set-logo {
    max-height: 28px;
    max-width: 160px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }
  .set-symbol {
    height: 22px;
    width: 22px;
    object-fit: contain;
    opacity: 0.6;
    flex-shrink: 0;
  }
  .set-name-fallback {
    font-size: 13px;
    font-weight: bold;
    color: white;
  }
  .set-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .set-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    padding: 6px 8px;
  }
  .stat-label {
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .stat-value {
    font-size: 13px;
    font-weight: bold;
    color: white;
  }
  .stat-total {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    font-weight: normal;
  }
</style>
