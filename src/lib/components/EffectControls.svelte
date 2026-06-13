<script>
  import { creator, EFFECTS, TYPES } from "../stores/creator.js";
  import { authStore } from "../stores/auth.js";
  import { savePreset as cloudSavePreset, deletePreset as cloudDeletePreset } from "../stores/cloudSync.js";

  let presetName = "";
  let showPresetInput = false;
  let showSaveSuccess = false;

  $: state = $creator;
  $: currentEffect = EFFECTS.find(e => e.id === state.settings.effectId) || EFFECTS[0];

  async function savePreset() {
    if (!presetName.trim()) return;
    creator.savePreset(presetName.trim());

    // Sync cloud si connecté
    const auth = null;
    authStore.subscribe(s => {
      if (s.user) {
        const state = null;
        creator.subscribe(cs => {
          const preset = cs.presets[0]; // le plus récent
          if (preset) cloudSavePreset(s.user.id, preset);
        })();
      }
    })();

    presetName = "";
    showPresetInput = false;
    showSaveSuccess = true;
    setTimeout(() => showSaveSuccess = false, 2000);
  }
</script>

<div class="controls-panel">

  <!-- ── Effets ─────────────────────────────────────────── -->
  <section class="section">
    <h3 class="section-title">✨ Effet holographique</h3>
    <div class="effect-grid">
      {#each EFFECTS as effect}
        <button
          class="effect-btn"
          class:active={state.settings.effectId === effect.id}
          on:click={() => creator.applyEffect(effect.id)}
          title={effect.label}
        >
          <span class="effect-label">{effect.label}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- ── Intensité ──────────────────────────────────────── -->
  <section class="section">
    <h3 class="section-title">🎚️ Intensité</h3>

    <div class="slider-row">
      <label>Shine
        <span class="value">{Math.round(state.settings.shineOpacity * 100)}%</span>
      </label>
      <input
        type="range" min="0" max="1" step="0.05"
        value={state.settings.shineOpacity}
        on:input={(e) => creator.updateSetting("shineOpacity", +e.target.value)}
      />
    </div>

    <div class="slider-row">
      <label>Glare
        <span class="value">{Math.round(state.settings.glareOpacity * 100)}%</span>
      </label>
      <input
        type="range" min="0" max="1" step="0.05"
        value={state.settings.glareOpacity}
        on:input={(e) => creator.updateSetting("glareOpacity", +e.target.value)}
      />
    </div>

    <div class="slider-row">
      <label>Rotation max
        <span class="value">{state.settings.rotationMax}°</span>
      </label>
      <input
        type="range" min="0" max="35" step="1"
        value={state.settings.rotationMax}
        on:input={(e) => creator.updateSetting("rotationMax", +e.target.value)}
      />
    </div>
  </section>

  <!-- ── Métadonnées carte ──────────────────────────────── -->
  <section class="section">
    <h3 class="section-title">🏷️ Infos carte</h3>

    <div class="meta-row">
      <label>Nom</label>
      <input
        type="text"
        value={state.card.name}
        on:input={(e) => creator.setCardData({ name: e.target.value })}
        placeholder="Nom de la carte"
      />
    </div>

    <div class="meta-row">
      <label>Type</label>
      <select
        value={state.card.types?.[0] || "colorless"}
        on:change={(e) => creator.setCardData({ types: [e.target.value] })}
      >
        {#each TYPES as t}
          <option value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
        {/each}
      </select>
    </div>
  </section>

  <!-- ── Presets ────────────────────────────────────────── -->
  <section class="section">
    <div class="presets-header">
      <h3 class="section-title">💾 Presets</h3>
      <button class="btn-sm" on:click={() => showPresetInput = !showPresetInput}>
        {showPresetInput ? "Annuler" : "+ Nouveau"}
      </button>
    </div>

    {#if showSaveSuccess}
      <p class="success">✅ Preset sauvegardé !</p>
    {/if}

    {#if showPresetInput}
      <div class="preset-input-row">
        <input
          type="text"
          bind:value={presetName}
          placeholder="Nom du preset..."
          on:keydown={(e) => e.key === "Enter" && savePreset()}
        />
        <button class="btn-primary" on:click={savePreset}>Sauver</button>
      </div>
    {/if}

    {#if state.presets.length === 0}
      <p class="hint-text">Aucun preset sauvegardé</p>
    {:else}
      <div class="preset-list">
        {#each state.presets as preset (preset.id)}
          <div class="preset-item">
            <button class="preset-load" on:click={() => creator.loadPreset(preset)}>
              {preset.name}
              <span class="preset-effect">{EFFECTS.find(e => e.id === preset.settings?.effectId)?.label || ""}</span>
            </button>
            <button class="preset-delete" on:click={() => creator.deletePreset(preset.id)} title="Supprimer">✕</button>
          </div>
        {/each}
      </div>
    {/if}
  </section>

</div>

<style>
  .controls-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    overflow-y: auto;
    padding-right: 4px;
  }

  .section {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 14px;
  }

  .section-title {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 12px;
  }

  /* Effect grid */
  .effect-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .effect-btn {
    padding: 7px 10px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-size: 12px;
    text-align: left;
    transition: all 0.15s ease;
    line-height: 1.3;
  }

  .effect-btn:hover {
    background: rgba(255,255,255,0.09);
    color: white;
  }

  .effect-btn.active {
    background: rgba(77,217,240,0.15);
    border-color: var(--primary, #4dd9f0);
    color: var(--primary, #4dd9f0);
    font-weight: bold;
  }

  .effect-label { display: block; }

  /* Sliders */
  .slider-row {
    margin-bottom: 12px;
  }

  .slider-row:last-child { margin-bottom: 0; }

  .slider-row label {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 5px;
  }

  .value {
    color: var(--primary, #4dd9f0);
    font-weight: bold;
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--primary, #4dd9f0);
    cursor: pointer;
  }

  /* Metadata */
  .meta-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .meta-row:last-child { margin-bottom: 0; }

  .meta-row label {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    min-width: 45px;
  }

  .meta-row input,
  .meta-row select {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    background: rgba(255,255,255,0.06);
    color: white;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .meta-row input:focus,
  .meta-row select:focus {
    border-color: var(--primary, #4dd9f0);
  }

  .meta-row select option { background: #2a2e3a; }

  /* Presets */
  .presets-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .presets-header .section-title { margin-bottom: 0; }

  .btn-sm {
    padding: 4px 10px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-sm:hover { background: rgba(255,255,255,0.12); color: white; }

  .preset-input-row {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }

  .preset-input-row input {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
    color: white;
    font-size: 13px;
    outline: none;
  }

  .preset-input-row input:focus { border-color: var(--primary, #4dd9f0); }

  .btn-primary {
    padding: 7px 14px;
    background: var(--primary, #4dd9f0);
    color: hsl(192, 87%, 15%);
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .preset-item {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .preset-load {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: white;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    overflow: hidden;
  }

  .preset-load:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.2);
  }

  .preset-effect {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
    margin-left: 8px;
    flex-shrink: 0;
  }

  .preset-delete {
    width: 28px;
    height: 28px;
    border: 1px solid rgba(255,100,100,0.2);
    border-radius: 6px;
    background: rgba(255,100,100,0.06);
    color: rgba(255,100,100,0.6);
    cursor: pointer;
    font-size: 11px;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .preset-delete:hover {
    background: rgba(255,100,100,0.2);
    color: hsl(0,80%,70%);
  }

  .hint-text {
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    text-align: center;
    margin: 0;
    padding: 8px 0;
  }

  .success {
    font-size: 13px;
    color: hsl(140, 70%, 60%);
    margin: 0 0 8px;
    text-align: center;
  }
</style>
