<script>
  import { creator } from "../stores/creator.js";
  import { authStore } from "../stores/auth.js";
  import { addToHistory } from "../stores/cloudSync.js";

  // Charge l'historique depuis localStorage
  let history = [];

  function loadHistory() {
    try {
      const raw = localStorage.getItem("card-history");
      history = raw ? JSON.parse(raw) : [];
    } catch(e) { history = []; }
  }

  function saveToHistory(card) {
    if (!card.img || card.id === "custom-001") return;
    try {
      const entry = {
        id: card.id,
        name: card.name,
        img: card.img.startsWith("http") ? card.img : card.img.slice(0, 100),
        rarity: card.rarity,
        set: card.set,
        number: card.number,
        types: card.types,
        supertype: card.supertype,
        subtypes: card.subtypes,
        viewedAt: Date.now(),
      };
      const existing = history.filter(h => h.id !== entry.id);
      history = [entry, ...existing].slice(0, 12);
      localStorage.setItem("card-history", JSON.stringify(history));

      // Sync cloud si connecté
      authStore.subscribe(s => {
        if (s.user) addToHistory(s.user.id, card);
      })();
    } catch(e) {}
  }

  // Observer les changements de carte dans le store
  $: if ($creator.card) {
    saveToHistory($creator.card);
  }

  loadHistory();

  function selectHistoryCard(entry) {
    creator.setCardDataWithEffect({
      id: entry.id,
      name: entry.name,
      img: entry.img,
      rarity: entry.rarity,
      set: entry.set,
      number: entry.number,
      types: entry.types || ["colorless"],
      supertype: entry.supertype || "pokémon",
      subtypes: entry.subtypes || ["Basic"],
    }, guessEffect(entry));
  }

  function guessEffect(card) {
    const r = (card.rarity || "").toLowerCase();
    const sub = (card.subtypes || []).join("").toLowerCase();
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

  function clearHistory() {
    history = [];
    localStorage.removeItem("card-history");
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff/60000)}min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff/3600000)}h`;
    return d.toLocaleDateString("fr-FR", { day:"numeric", month:"short" });
  }
</script>

{#if history.length > 0}
  <div class="history-box">
    <div class="history-header">
      <span class="history-title">🕐 Récemment consultées</span>
      <button class="clear-btn" on:click={clearHistory} title="Effacer l'historique">Effacer</button>
    </div>

    <div class="history-grid">
      {#each history as entry (entry.id + entry.viewedAt)}
        <button
          class="history-card"
          class:active={$creator.card.id === entry.id}
          on:click={() => selectHistoryCard(entry)}
          title="{entry.name} — {entry.rarity || ''}"
        >
          <div class="history-img-wrap">
            <img src={entry.img} alt={entry.name} loading="lazy" />
          </div>
          <div class="history-info">
            <span class="history-name">{entry.name}</span>
            <span class="history-time">{formatTime(entry.viewedAt)}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .history-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .history-title {
    font-size: 13px;
    font-weight: bold;
    color: white;
  }
  .clear-btn {
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .clear-btn:hover { color: rgba(255,100,100,0.7); }

  .history-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .history-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.18s ease;
    text-align: center;
    min-width: 0;
  }
  .history-card:hover {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.18);
    transform: translateY(-2px);
  }
  .history-card.active {
    border-color: var(--primary, #4dd9f0);
    background: rgba(77,217,240,0.08);
    box-shadow: 0 0 10px rgba(77,217,240,0.15);
  }

  .history-img-wrap {
    width: 100%;
    line-height: 0;
  }
  .history-img-wrap img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 7px 7px 0 0;
  }
  .history-info {
    padding: 4px 4px 5px;
    background: rgba(0,0,0,0.5);
    border-radius: 0 0 7px 7px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .history-name {
    font-size: 9px;
    color: white;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
  .history-time {
    font-size: 8px;
    color: rgba(255,255,255,0.3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
