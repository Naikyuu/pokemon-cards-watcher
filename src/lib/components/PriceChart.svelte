<script>
  import { creator } from "../stores/creator.js";
  import pokemon from "pokemontcgsdk";

  pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY || "" });

  // pokemontcg.io ne fournit qu'un snapshot — on simule un historique
  // en stockant les prix en localStorage à chaque consultation
  let history = [];
  let currentPrice = null;
  let loading = false;

  $: cardId = $creator.card.id;
  $: cardImg = $creator.card.img;

  // Reset si image locale (base64 ou id custom)
  $: {
    const isLocal = !cardId || cardId.startsWith("custom") || cardImg?.startsWith("data:");
    if (isLocal) { history = []; currentPrice = null; }
    else { loadHistory(cardId); }
  }

  async function loadHistory(id) {
    if (!id || id.startsWith("custom")) { history = []; return; }
    loading = true;
    try {
      // Charger le snapshot du jour
      const result = await pokemon.card.find(id);
      const prices = result?.tcgplayer?.prices || result?.cardmarket?.prices;
      if (!prices) { history = loadStored(id); loading = false; return; }

      const preferred = ["holofoil","reverseHolofoil","normal","1stEditionHolofoil","unlimited"];
      let entry = null;
      for (const k of preferred) { if (prices[k]) { entry = prices[k]; break; } }
      if (!entry) { const k = Object.keys(prices)[0]; entry = prices[k]; }
      if (!entry?.market) { loading = false; return; }

      currentPrice = entry.market;
      const today = new Date().toISOString().slice(0, 10);
      const stored = loadStored(id);

      // Ajouter le point du jour s'il n'existe pas encore
      const lastEntry = stored[stored.length - 1];
      if (!lastEntry || lastEntry.date !== today) {
        stored.push({ date: today, price: entry.market });
        // Garder max 90 entrées
        const trimmed = stored.slice(-90);
        try { localStorage.setItem(`price-history-${id}`, JSON.stringify(trimmed)); } catch(e) {}
        history = trimmed;
      } else {
        history = stored;
      }
    } catch(e) { history = loadStored(id); }
    finally { loading = false; }
  }

  function loadStored(id) {
    try {
      const raw = localStorage.getItem(`price-history-${id}`);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  // Calcul du sparkline SVG
  $: sparkline = buildSparkline(history);
  $: trend = history.length >= 2
    ? history[history.length - 1].price - history[0].price
    : 0;

  function buildSparkline(pts) {
    if (pts.length < 2) return null;
    const W = 240, H = 48, PAD = 4;
    const prices = pts.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const points = pts.map((p, i) => {
      const x = PAD + (i / (pts.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (p.price - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    });
    // Area fill path
    const first = points[0].split(",");
    const last = points[points.length - 1].split(",");
    const area = `M${first[0]},${H} L${points.join(" L")} L${last[0]},${H} Z`;
    return { line: `M${points.join(" L")}`, area, W, H, min, max, pts };
  }

  function fmtDate(str) {
    const d = new Date(str);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
</script>

{#if loading}
  <div class="chart-box chart-box--loading">⏳ Chargement des prix...</div>
{:else if history.length >= 2}
  <div class="chart-box">
    <div class="chart-header">
      <span class="chart-title">📈 Historique des prix</span>
      <span class="chart-trend" class:up={trend > 0} class:down={trend < 0}>
        {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"}
        {Math.abs(trend).toFixed(2)}$
      </span>
    </div>

    {#if sparkline}
      <div class="chart-wrap">
        <svg viewBox="0 0 {sparkline.W} {sparkline.H}" xmlns="http://www.w3.org/2000/svg" class="sparkline">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color={trend >= 0 ? "#4dd9f0" : "#f06b6b"} stop-opacity="0.25"/>
              <stop offset="100%" stop-color={trend >= 0 ? "#4dd9f0" : "#f06b6b"} stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d={sparkline.area} fill="url(#spark-fill)" />
          <path d={sparkline.line} fill="none"
            stroke={trend >= 0 ? "#4dd9f0" : "#f06b6b"}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <!-- Point actuel -->
          {#each [sparkline.pts[sparkline.pts.length - 1]] as last}
            {@const lx = 4 + ((sparkline.pts.length - 1) / (sparkline.pts.length - 1)) * (sparkline.W - 8)}
            {@const ly = 4 + (1 - (last.price - sparkline.min) / (sparkline.max - sparkline.min || 1)) * (sparkline.H - 8)}
            <circle cx={lx} cy={ly} r="3" fill={trend >= 0 ? "#4dd9f0" : "#f06b6b"} />
          {/each}
        </svg>
        <div class="chart-labels">
          <span>{fmtDate(history[0].date)}</span>
          <span class="chart-current">${currentPrice?.toFixed(2) || history[history.length-1].price.toFixed(2)}</span>
          <span>{fmtDate(history[history.length - 1].date)}</span>
        </div>
        <div class="chart-range">
          <span>Min: ${Math.min(...history.map(h => h.price)).toFixed(2)}</span>
          <span>{history.length} relevé{history.length > 1 ? "s" : ""}</span>
          <span>Max: ${Math.max(...history.map(h => h.price)).toFixed(2)}</span>
        </div>
      </div>
    {/if}

    {#if history.length < 5}
      <p class="chart-hint">💡 L'historique se construit à chaque visite — revenez dans quelques jours pour voir l'évolution.</p>
    {/if}
  </div>
{:else if cardId && !cardId.startsWith("custom")}
  <div class="chart-box chart-box--empty">
    <span>📊</span>
    <p>Premier relevé de prix enregistré.<br/>L'historique se construira au fil de vos visites.</p>
  </div>
{/if}

<style>
  .chart-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
    flex-shrink: 0;
  }
  .chart-box--loading, .chart-box--empty {
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    text-align: center;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .chart-box--empty span { font-size: 24px; }
  .chart-box--empty p { margin: 0; line-height: 1.5; font-size: 12px; }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .chart-title {
    font-size: 13px;
    font-weight: bold;
    color: white;
  }
  .chart-trend {
    font-size: 12px;
    font-weight: bold;
    color: rgba(255,255,255,0.4);
  }
  .chart-trend.up { color: #4dd9f0; }
  .chart-trend.down { color: #f06b6b; }

  .chart-wrap { display: flex; flex-direction: column; gap: 4px; }

  .sparkline { width: 100%; height: 48px; display: block; }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }
  .chart-current {
    font-weight: bold;
    color: var(--primary, #4dd9f0);
    font-size: 13px;
  }
  .chart-range {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    margin-top: 2px;
  }
  .chart-hint {
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    margin: 8px 0 0;
    line-height: 1.5;
    text-align: center;
  }
</style>
