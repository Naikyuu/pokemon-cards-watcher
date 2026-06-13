<script>
  import { onMount } from "svelte";
  import { creator } from "../stores/creator.js";
  import { encodeState, decodeState, applyUrlState } from "../utils/urlState.js";
  import { EFFECTS } from "../stores/creator.js";
  import Card from "./Card.svelte";
  import CardModal from "./CardModal.svelte";
  import pokemon from "pokemontcgsdk";

  let showModal = false;

  let previewEl;
  let isExporting = false;
  let exportMsg = "";
  let shareMsg = "";

  // Prix marché
  let priceData = null;
  let priceLoading = false;
  let priceError = false;

  pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY || "" });

  $: state = $creator;
  $: card = state.card;
  $: settings = state.settings;
  $: cardScale = settings.cardScale ?? 1;
  $: showcaseMode = settings.showcaseMode ?? false;

  // Clé unique — force Card.svelte à se remonter à chaque changement
  $: imgKey = card.img ? (card.img.slice(0, 80) + String(card.img.length)) : "empty";
  $: cardKey = imgKey + "||" + card.rarity + "||" + card.id + "||" + showcaseMode;

  // Reset le prix si on passe sur une image locale (id custom ou img base64)
  $: {
    const isLocal = !card.id || card.id.startsWith("custom") || card.img?.startsWith("data:");
    if (isLocal) {
      priceData = null;
      priceError = false;
      priceLoading = false;
    } else {
      fetchPrice(card.id);
    }
  }

  $: intensityStyles = `
    --creator-shine-opacity: ${settings.shineOpacity};
    --creator-glare-opacity: ${settings.glareOpacity};
    --creator-rotation-max: ${settings.rotationMax}deg;
  `;

  async function fetchPrice(cardId) {
    if (!cardId || cardId.startsWith("custom")) { priceData = null; return; }
    priceLoading = true; priceError = false; priceData = null;
    try {
      const result = await pokemon.card.find(cardId);
      // Récupérer les deux sources indépendamment
      const tcg = normalizeTcg(result?.tcgplayer?.prices, result?.tcgplayer?.url);
      const cm  = normalizeCm(result?.cardmarket?.prices, result?.cardmarket?.url);
      priceData = (tcg || cm) ? { tcg, cm } : null;
    } catch(e) { priceError = true; }
    finally { priceLoading = false; }
  }

  function normalizeTcg(prices, url) {
    if (!prices) return null;
    const preferred = ["holofoil","reverseHolofoil","normal","1stEditionHolofoil","unlimited"];
    let entry = null, label = "";
    for (const key of preferred) { if (prices[key]) { entry = prices[key]; label = key; break; } }
    if (!entry) { const k = Object.keys(prices)[0]; if (k) { entry = prices[k]; label = k; } }
    if (!entry) return null;
    const fmt = (v) => v != null ? `$${Number(v).toFixed(2)}` : "—";
    return {
      source: "TCGPlayer",
      currency: "$",
      label: label.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim(),
      low: fmt(entry.low),
      market: fmt(entry.market),
      high: fmt(entry.high),
      url,
    };
  }

  function normalizeCm(prices, url) {
    if (!prices) return null;
    // Cardmarket a une structure différente
    const p = prices;
    const fmt = (v) => v != null ? `${Number(v).toFixed(2)}€` : "—";
    // averageSellPrice = prix moyen de vente, lowPrice = prix le plus bas, trendPrice = tendance
    const market = p.averageSellPrice ?? p.avg1 ?? p.trendPrice ?? null;
    const low    = p.lowPrice ?? p.avg7 ?? null;
    const high   = p.avg30 ?? null;
    if (market == null && low == null) return null;
    return {
      source: "Cardmarket",
      currency: "€",
      label: "Prix moyen",
      low: fmt(low),
      market: fmt(market),
      high: fmt(high),
      url,
    };
  }

  function shareUrl() {
    const encoded = encodeState(card, settings);
    if (!encoded) return;

    // URL directe vers l'app
    const appUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;

    // URL OG pour les previews (Discord, Twitter, etc.)
    const ogParams = new URLSearchParams({
      name:   card.name   || "",
      img:    card.img?.startsWith("http") ? card.img : "",
      rarity: card.rarity || "",
      effect: settings.effectId || "",
    });
    const shareUrl = `${window.location.origin}/api/og?${ogParams}#state=${encoded}`;

    // Web Share API (mobile natif)
    if (navigator.share) {
      navigator.share({
        title: `${card.name || "Carte"} — TCG Holo Lab`,
        text: `Regarde cette carte Pokémon avec effet holographique !`,
        url: appUrl,
      }).then(() => {
        shareMsg = "✅ Partagé !";
        setTimeout(() => shareMsg = "", 3000);
      }).catch(() => {});
    } else {
      // Fallback clipboard
      navigator.clipboard.writeText(appUrl).then(() => {
        shareMsg = "✅ URL copiée !";
        setTimeout(() => shareMsg = "", 3000);
      }).catch(() => {
        shareMsg = "⚠️ Copiez manuellement";
      });
    }
  }

  // Lien Pokédex — extrait le nom de base du Pokémon
  // Ex: "Pikachu ex" → "pikachu", "Giratina V" → "giratina",
  //     "Zoroark de N" → "zoroark", "Méga Dracaufeu" → "charizard"
  function extractPokedexName(name) {
    if (!name) return null;
    let n = name
      // Retire les suffixes de forme/rareté courants
      .replace(/(ex|EX|GX|V|VMAX|VSTAR|V-UNION|TAG TEAM|SP|LEGEND|BREAK|MEGA|PRIME|Radiant|Shiny)/gi, "")
      // Retire les mentions "de X" (Zoroark de N, etc.)
      .replace(/de\s+\w+/gi, "")
      // Retire les mentions "du", "la", "le", "les" + mot
      .replace(/(du|de la|de|la|le|les)\s+\w+/gi, "")
      // Retire les & et ce qui suit (Tag Team)
      .replace(/\s*&.*$/, "")
      // Retire les caractères spéciaux sauf tiret
      .replace(/[^a-zA-ZÀ-ÿ\s-]/g, "")
      .trim();

    // Normalise : retire les accents pour l'URL
    n = n.normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return n || null;
  }

  $: pokedexName = extractPokedexName(card.name);
  $: pokedexUrl = pokedexName
    ? `https://www.pokemondb.net/pokedex/${pokedexName}`
    : null;

  async function exportCard() {
    if (isExporting) return;
    isExporting = true; exportMsg = "";
    try {
      const { default: html2canvas } = await import("html2canvas");
      const cardEl = previewEl?.querySelector(".card");
      if (!cardEl) throw new Error("Card element not found");
      const canvas = await html2canvas(cardEl, {
        backgroundColor: null, scale: 2, useCORS: true, allowTaint: true, logging: false,
      });
      const link = document.createElement("a");
      link.download = `${card.name || "carte"}-${settings.effectId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      exportMsg = "✅ Image téléchargée !";
    } catch(err) {
      exportMsg = "⚠️ Export non disponible (CORS). Utilisez un screenshot.";
    } finally {
      isExporting = false;
      setTimeout(() => exportMsg = "", 4000);
    }
  }

  onMount(() => {
    creator.loadFromStorage();
    // Lire le state depuis l'URL au chargement
    const decoded = decodeState(window.location.hash);
    if (decoded) applyUrlState(decoded, creator, EFFECTS);
  });
</script>

<div class="preview-wrap">

  <!-- Stage -->
  <div class="card-stage-outer">
    <div class="card-stage" bind:this={previewEl} style={intensityStyles}>
      {#if !card.img}
        <div class="empty-state">
          <span>🃏</span>
          <p>Importe ou recherche une carte<br/>pour voir l'effet</p>
        </div>
      {:else}
        <div class="card-container" style="width: {Math.round(240 * cardScale)}px;">
          {#key cardKey}
            <Card
              id={card.id}
              name={card.name}
              img={card.img}
              number={card.number}
              set={card.set}
              types={card.types}
              supertype={card.supertype}
              subtypes={card.subtypes}
              rarity={card.rarity}
              showcase={showcaseMode}
            />
          {/key}
        </div>
      {/if}
    </div>
  </div>

  <!-- Bouton agrandir -->
  {#if card.img}
    <button class="btn-expand" on:click={() => showModal = true} title="Voir en grand">
      ⛶ Agrandir
    </button>
  {/if}

  <!-- Modale plein écran -->
  {#if showModal}
    <CardModal onClose={() => showModal = false} />
  {/if}

  <!-- Contrôles rapides sous la carte -->
  <div class="quick-controls">
    <!-- Taille -->
    <div class="quick-row">
      <span class="quick-label">Taille</span>
      <input type="range" min="0.6" max="1.6" step="0.05"
        value={cardScale}
        on:input={(e) => creator.updateSetting("cardScale", +e.target.value)}
      />
      <span class="quick-val">{Math.round(cardScale * 100)}%</span>
    </div>

    <!-- Mode showcase -->
    <div class="quick-row quick-row--showcase">
      <span class="quick-label">Mode showcase</span>
      <button
        class="toggle-btn"
        class:active={showcaseMode}
        on:click={() => creator.updateSetting("showcaseMode", !showcaseMode)}
        title="Active l'animation d'entrée tournante"
      >
        {showcaseMode ? "ON" : "OFF"}
      </button>
      <span class="quick-hint">animation auto</span>
    </div>
  </div>

  <!-- Effet badge + Pokédex -->
  <div class="meta-row">
    <div class="effect-badge">
      <span class="badge-label">Effet :</span>
      <span class="badge-value">{settings.effectId.replace(/-/g, ' ')}</span>
    </div>
    {#if pokedexUrl && card.img}
      <a class="pokedex-link" href={pokedexUrl} target="_blank" rel="noopener" title="Voir sur le Pokédex">
        📖 Pokédex
      </a>
    {/if}
  </div>

  <!-- Prix marché -->
  {#if priceLoading}
    <div class="price-box price-box--loading"><span>⏳</span> Chargement des prix...</div>
  {:else if priceData}
    <div class="price-box">
      <div class="price-title-row">💰 Prix marché</div>

      {#each [priceData.tcg, priceData.cm].filter(Boolean) as src}
        <div class="price-source">
          <div class="price-source-header">
            <span class="price-source-name" class:tcg={src.source==='TCGPlayer'} class:cm={src.source==='Cardmarket'}>
              {src.source}
            </span>
            <span class="price-source-label">{src.label}</span>
          </div>
          <div class="price-grid">
            <div class="price-cell">
              <span class="price-cell-label">Bas</span>
              <span class="price-cell-value">{src.low}</span>
            </div>
            <div class="price-cell price-cell--highlight">
              <span class="price-cell-label">Marché</span>
              <span class="price-cell-value">{src.market}</span>
            </div>
            <div class="price-cell">
              <span class="price-cell-label">Haut</span>
              <span class="price-cell-value">{src.high}</span>
            </div>
          </div>
          {#if src.url}
            <a class="price-link" href={src.url} target="_blank" rel="noopener">
              Voir sur {src.source} →
            </a>
          {/if}
        </div>
      {/each}
    </div>
  {:else if priceError || (!priceLoading && !priceData && card.id && !card.id.startsWith("custom"))}
    <div class="price-box price-box--unavailable">
      <div class="unavail-title">💰 Prix non disponibles</div>
      <p class="unavail-desc">Cette carte n'a pas de données de prix dans l'API — elle est peut-être japonaise, promo, ou trop récente.</p>
      <div class="unavail-links">
        <a
          href="https://www.tcgplayer.com/search/pokemon/product?q={encodeURIComponent(card.name)}"
          target="_blank" rel="noopener" class="unavail-link unavail-link--tcg"
        >Chercher sur TCGPlayer →</a>
        <a
          href="https://www.cardmarket.com/en/Pokemon/Products/Search?searchString={encodeURIComponent(card.name)}"
          target="_blank" rel="noopener" class="unavail-link unavail-link--cm"
        >Chercher sur Cardmarket →</a>
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="actions-row">
    <button class="btn-share" on:click={shareUrl} disabled={!card.img}>
      🔗 Partager
    </button>
    <button class="btn-export" on:click={exportCard} disabled={!card.img || isExporting}>
      {isExporting ? "Export..." : "⬇️ PNG"}
    </button>
  </div>
  {#if shareMsg}<p class="share-msg">{shareMsg}</p>{/if}
  {#if exportMsg}<p class="export-msg">{exportMsg}</p>{/if}

</div>

<style>
  .preview-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    height: 100%;
  }

  .card-stage-outer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* padding vertical généreux pour absorber le zoom sans clipper */
    padding: 60px 20px 30px;
    position: relative;
    /* overflow visible pour que le zoom ne soit pas coupé par ce conteneur */
    overflow: visible;
  }

  .card-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow: visible;
    position: relative;
  }

  .card-stage :global(.card__shine) {
    opacity: var(--creator-shine-opacity, 1) !important;
  }
  .card-stage :global(.card__glare) {
    opacity: calc(var(--card-opacity) * var(--creator-glare-opacity, 1)) !important;
  }

  .card-container {
    position: relative;
    z-index: 10;
    overflow: visible;
    transition: width 0.2s ease;
    max-width: 90%;
  }

  .empty-state {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; color: rgba(255,255,255,0.2); text-align: center;
  }
  .empty-state span { font-size: 56px; }
  .empty-state p { font-size: 14px; line-height: 1.5; margin: 0; }

  /* ── Bouton agrandir ── */
  .btn-expand {
    padding: 6px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    color: rgba(255,255,255,0.5);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    letter-spacing: 0.03em;
  }
  .btn-expand:hover {
    background: rgba(255,255,255,0.12);
    color: white;
    border-color: rgba(255,255,255,0.25);
  }

  /* ── Quick controls ── */
  .quick-controls {
    width: 100%;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  .quick-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .quick-label {
    color: rgba(255,255,255,0.45);
    min-width: 48px;
    flex-shrink: 0;
  }
  .quick-row input[type="range"] {
    flex: 1; accent-color: var(--primary, #4dd9f0); cursor: pointer;
  }
  .quick-val {
    color: var(--primary, #4dd9f0);
    font-weight: bold;
    font-size: 11px;
    min-width: 32px;
    text-align: right;
  }
  .quick-row--showcase { justify-content: space-between; }
  .quick-hint { font-size: 10px; color: rgba(255,255,255,0.2); flex: 1; text-align: right; }

  .toggle-btn {
    padding: 3px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.4);
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.05em;
  }
  .toggle-btn.active {
    background: rgba(77,217,240,0.2);
    border-color: rgba(77,217,240,0.5);
    color: var(--primary, #4dd9f0);
  }

  /* ── Meta row (badge + pokédex) ── */
  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .pokedex-link {
    padding: 5px 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    color: rgba(255,255,255,0.5);
    font-size: 12px;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .pokedex-link:hover { background: rgba(255,255,255,0.12); color: white; }

  /* ── Effect badge ── */
  .effect-badge {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; font-size: 12px; flex-shrink: 0;
  }
  .badge-label { color: rgba(255,255,255,0.4); }
  .badge-value { color: var(--primary, #4dd9f0); font-weight: bold; text-transform: capitalize; }

  /* ── Prix ── */
  .price-box {
    width: 100%; max-width: 290px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px; padding: 12px 14px; flex-shrink: 0;
    display: flex; flex-direction: column; gap: 10px;
  }
  .price-box--loading {
    color: rgba(255,255,255,0.35); font-size: 13px; text-align: center;
    display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;
  }
  .price-box--error { color: rgba(255,150,100,0.7); font-size: 12px; text-align: center; padding: 8px; }
  .price-title-row { font-size: 13px; font-weight: bold; color: white; }

  .price-source {
    display: flex; flex-direction: column; gap: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .price-source:first-of-type { border-top: none; padding-top: 0; }
  .price-source-header { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
  .price-source-name {
    font-size: 11px; font-weight: 700; padding: 2px 8px;
    border-radius: 10px; letter-spacing: 0.04em;
  }
  .price-source-name.tcg { background: rgba(0,100,220,0.2); color: #60a5fa; border: 1px solid rgba(0,100,220,0.3); }
  .price-source-name.cm  { background: rgba(20,160,80,0.2); color: #4ade80; border: 1px solid rgba(20,160,80,0.3); }
  .price-source-label { font-size: 10px; color: rgba(255,255,255,0.3); }

  .price-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
  .price-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; background: rgba(255,255,255,0.04); border-radius: 7px; padding: 6px 4px; }
  .price-cell--highlight { background: rgba(77,217,240,0.08); border: 1px solid rgba(77,217,240,0.2); }
  .price-cell-label { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; }
  .price-cell-value { font-size: 13px; font-weight: bold; color: white; }
  .price-cell--highlight .price-cell-value { color: var(--primary, #4dd9f0); }
  .price-link { display: block; text-align: right; font-size: 11px; color: rgba(255,255,255,0.25); text-decoration: none; transition: color 0.2s; }
  .price-link:hover { color: var(--primary, #4dd9f0); }

  /* ── Prix indisponible ── */
  .price-box--unavailable {
    width: 100%; max-width: 290px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 12px 14px; flex-shrink: 0;
  }
  .unavail-title { font-size: 13px; font-weight: bold; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
  .unavail-desc { font-size: 11px; color: rgba(255,255,255,0.25); margin: 0 0 10px; line-height: 1.5; }
  .unavail-links { display: flex; flex-direction: column; gap: 5px; }
  .unavail-link {
    display: block; padding: 7px 10px;
    border-radius: 7px; font-size: 12px; font-weight: 600;
    text-decoration: none; transition: all 0.2s; text-align: center;
  }
  .unavail-link--tcg {
    background: rgba(0,100,220,0.12);
    border: 1px solid rgba(0,100,220,0.25);
    color: #60a5fa;
  }
  .unavail-link--tcg:hover { background: rgba(0,100,220,0.22); }
  .unavail-link--cm {
    background: rgba(20,160,80,0.12);
    border: 1px solid rgba(20,160,80,0.25);
    color: #4ade80;
  }
  .unavail-link--cm:hover { background: rgba(20,160,80,0.22); }

  /* ── Actions ── */
  .actions-row {
    display: flex; gap: 8px; width: 100%; max-width: 290px; flex-shrink: 0;
  }
  .btn-share {
    flex: 1; padding: 9px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7);
    border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer;
    transition: all 0.2s;
  }
  .btn-share:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: white; }
  .btn-share:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-export {
    flex: 1; padding: 9px;
    background: linear-gradient(135deg, rgba(77,217,240,0.2), rgba(77,217,240,0.1));
    border: 1px solid rgba(77,217,240,0.4);
    color: var(--primary, #4dd9f0);
    border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer;
    transition: all 0.2s;
  }
  .btn-export:hover:not(:disabled) { background: linear-gradient(135deg, rgba(77,217,240,0.3), rgba(77,217,240,0.15)); }
  .btn-export:disabled { opacity: 0.3; cursor: not-allowed; }
  .share-msg, .export-msg {
    font-size: 11px; color: rgba(255,255,255,0.45); margin: 0; text-align: center;
  }
</style>
