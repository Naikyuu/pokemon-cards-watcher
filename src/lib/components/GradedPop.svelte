<script>
  import { creator } from "../stores/creator.js";

  // Ni PSA ni CGC n'ont d'API publique gratuite.
  // On fournit des liens directs vers leurs pop reports
  // et on récupère ce qu'on peut via pokemontcg.io (numéro + set).
  $: card = $creator.card;
  $: isCustom = !card.id || card.id.startsWith("custom");

  $: psaUrl = buildPsaUrl(card);
  $: cgcUrl = buildCgcUrl(card);

  function buildPsaUrl(card) {
    if (!card.name) return "https://www.psacard.com/pop";
    const q = encodeURIComponent(`${card.name} pokemon`);
    return `https://www.psacard.com/pop/search?category=13&q=${q}`;
  }

  function buildCgcUrl(card) {
    if (!card.name) return "https://www.cgccards.com/population-report/tcg/pok%C3%A9mon/2/";
    const q = encodeURIComponent(card.name);
    return `https://www.cgccards.com/population-report/tcg/pok%C3%A9mon/2/?search=${q}`;
  }

  // Grade tiers à afficher (indicatifs)
  const grades = [
    { label: "PSA 10", desc: "Gem Mint", icon: "💎" },
    { label: "PSA 9",  desc: "Mint",     icon: "✨" },
    { label: "PSA 8",  desc: "NM-MT",    icon: "🌟" },
    { label: "CGC 10", desc: "Pristine", icon: "💎" },
    { label: "CGC 9.5",desc: "Gem Mint+",icon: "✨" },
  ];
</script>

{#if !isCustom}
  <div class="pop-box">
    <div class="pop-header">
      <span class="pop-title">🏆 Population gradée</span>
    </div>

    <p class="pop-desc">
      PSA et CGC ne proposent pas d'API publique — accède directement à leurs bases de données :
    </p>

    <div class="pop-links">
      <a href={psaUrl} target="_blank" rel="noopener" class="pop-link pop-link--psa">
        <div class="pop-link-brand">PSA</div>
        <div class="pop-link-info">
          <span class="pop-link-name">{card.name || "Carte"}</span>
          <span class="pop-link-sub">Population report →</span>
        </div>
      </a>

      <a href={cgcUrl} target="_blank" rel="noopener" class="pop-link pop-link--cgc">
        <div class="pop-link-brand">CGC</div>
        <div class="pop-link-info">
          <span class="pop-link-name">{card.name || "Carte"}</span>
          <span class="pop-link-sub">Population report →</span>
        </div>
      </a>
    </div>

    <div class="grade-guide">
      <p class="grade-guide-title">Référence des grades</p>
      <div class="grade-list">
        {#each grades as g}
          <div class="grade-item">
            <span class="grade-icon">{g.icon}</span>
            <span class="grade-label">{g.label}</span>
            <span class="grade-desc">{g.desc}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .pop-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
    flex-shrink: 0;
  }
  .pop-header {
    margin-bottom: 8px;
  }
  .pop-title {
    font-size: 13px;
    font-weight: bold;
    color: white;
  }
  .pop-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    margin: 0 0 10px;
    line-height: 1.4;
  }
  .pop-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .pop-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    text-decoration: none;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .pop-link--psa {
    background: rgba(0, 80, 180, 0.15);
    border-color: rgba(0, 100, 220, 0.25);
  }
  .pop-link--psa:hover {
    background: rgba(0, 80, 180, 0.25);
    border-color: rgba(0, 100, 220, 0.5);
  }
  .pop-link--cgc {
    background: rgba(180, 120, 0, 0.15);
    border-color: rgba(220, 150, 0, 0.25);
  }
  .pop-link--cgc:hover {
    background: rgba(180, 120, 0, 0.25);
    border-color: rgba(220, 150, 0, 0.5);
  }
  .pop-link-brand {
    font-size: 14px;
    font-weight: 900;
    color: white;
    font-family: "Roboto Condensed", sans-serif;
    letter-spacing: 0.05em;
    min-width: 36px;
  }
  .pop-link--psa .pop-link-brand { color: #5599ff; }
  .pop-link--cgc .pop-link-brand { color: #ffbb44; }
  .pop-link-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
  }
  .pop-link-name {
    font-size: 13px;
    color: white;
    font-weight: bold;
  }
  .pop-link-sub {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
  }
  .grade-guide {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 10px;
  }
  .grade-guide-title {
    font-size: 10px;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 8px;
  }
  .grade-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .grade-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .grade-icon { font-size: 13px; }
  .grade-label { color: white; font-weight: bold; min-width: 56px; }
  .grade-desc { color: rgba(255,255,255,0.35); }
</style>
