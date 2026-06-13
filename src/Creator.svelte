<script>
  import { onMount } from "svelte";
  import CardImport from "./lib/components/CardImport.svelte";
  import CardPreview from "./lib/components/CardPreview.svelte";
  import EffectControls from "./lib/components/EffectControls.svelte";
  import SetInfo from "./lib/components/SetInfo.svelte";
  import SetCards from "./lib/components/SetCards.svelte";
  import AltArts from "./lib/components/AltArts.svelte";
  import PriceChart from "./lib/components/PriceChart.svelte";
  import GradedPop from "./lib/components/GradedPop.svelte";
  import GifExport from "./lib/components/GifExport.svelte";
  import AuthModal from "./lib/components/AuthModal.svelte";
  import UserMenu from "./lib/components/UserMenu.svelte";
  import Favorites from "./lib/components/Favorites.svelte";
  import { authStore, isLoggedIn } from "./lib/stores/auth.js";
  import { fetchPresets, fetchHistory, fetchFavorites } from "./lib/stores/cloudSync.js";
  import { creator } from "./lib/stores/creator.js";

  export let onBack = () => {};

  let showAuth = false;

  const tabs = [
    { id: "effects",   label: "Effets" },
    { id: "favorites", label: "Favoris" },
    { id: "data",      label: "Données" },
    { id: "export",    label: "Export" },
  ];
  let rightTab = "effects";

  onMount(() => {
    authStore.init();
    // Charger les données cloud quand connecté
    const unsub = isLoggedIn.subscribe(async loggedIn => {
      if (loggedIn) {
        const $auth = null;
        authStore.subscribe(s => {
          if (s.user) syncCloud(s.user.id);
        })();
      }
    });
    return unsub;
  });

  async function syncCloud(userId) {
    const [cloudPresets, cloudHistory] = await Promise.all([
      fetchPresets(userId),
      fetchHistory(userId),
    ]);
    if (cloudPresets) {
      creator.update(s => ({ ...s, presets: cloudPresets }));
    }
    if (cloudHistory) {
      try { localStorage.setItem("card-history", JSON.stringify(cloudHistory)); } catch(e) {}
    }
  }
</script>

<div class="creator-layout">

  <header class="creator-header">
    <button class="back-btn" on:click={onBack}>← Retour</button>
    <h1 class="creator-title">
      <span class="title-icon">🎴</span>
      TCG Holo Lab
    </h1>
    <span class="creator-sub">Explore et applique des effets holographiques sur tes cartes</span>
    <div class="header-right">
      <UserMenu onShowAuth={() => showAuth = true} />
    </div>
  </header>

  {#if showAuth}
    <AuthModal onClose={() => showAuth = false} />
  {/if}

  <div class="creator-panels">

    <aside class="panel panel--import">
      <h2 class="panel-title">Import</h2>
      <CardImport />
    </aside>

    <main class="panel panel--preview">
      <h2 class="panel-title">Prévisualisation</h2>
      <CardPreview />
    </main>

    <aside class="panel panel--controls">
      <div class="right-tabs">
        {#each tabs as tab}
          <button
            class="right-tab"
            class:active={rightTab === tab.id}
            on:click={() => rightTab = tab.id}
          >{tab.label}</button>
        {/each}
      </div>

      {#if rightTab === "effects"}
        <EffectControls />
      {:else if rightTab === "favorites"}
        <Favorites onShowAuth={() => showAuth = true} />
      {:else if rightTab === "data"}
        <SetInfo />
        <SetCards />
        <AltArts />
        <PriceChart />
        <GradedPop />
      {:else if rightTab === "export"}
        <GifExport />
      {/if}
    </aside>

  </div>

</div>

<style>
  .creator-layout {
    height: 100vh;
    overflow: hidden;
    background: hsl(220, 7%, 24%);
    color: white;
    display: flex;
    flex-direction: column;
    font-family: Roboto, sans-serif;
  }

  .creator-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 24px;
    background: rgba(0,0,0,0.25);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }

  .back-btn {
    padding: 7px 16px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    cursor: pointer; font-size: 13px;
    transition: all 0.2s; white-space: nowrap;
  }
  .back-btn:hover { background: rgba(255,255,255,0.12); color: white; }

  .creator-title {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 22px; margin: 0;
    display: flex; align-items: center; gap: 8px;
  }
  .title-icon { font-size: 24px; }
  .creator-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
  .header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

  .creator-panels {
    display: grid;
    grid-template-columns: 280px 1fr 300px;
    flex: 1; min-height: 0; overflow: hidden;
  }

  .panel {
    padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
    overflow-y: auto; height: 100%;
    box-sizing: border-box;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .panel:last-child { border-right: none; }
  .panel--preview {
    background: radial-gradient(ellipse at 50% 30%, rgba(77,217,240,0.04) 0%, transparent 65%);
    border-right: 1px solid rgba(255,255,255,0.06);
    overflow: auto;
  }

  .panel-title {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 11px; font-weight: 700;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase; letter-spacing: 0.12em;
    margin: 0; padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }

  .right-tabs {
    display: flex; gap: 3px; flex-shrink: 0;
    background: rgba(0,0,0,0.15);
    padding: 3px; border-radius: 10px;
  }
  .right-tab {
    flex: 1; padding: 5px 6px; border: none; border-radius: 7px;
    background: transparent; color: rgba(255,255,255,0.4);
    font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .right-tab.active { background: rgba(255,255,255,0.1); color: white; }
  .right-tab:hover:not(.active) { color: rgba(255,255,255,0.7); }

  @media screen and (max-width: 1100px) {
    .creator-panels { grid-template-columns: 240px 1fr 260px; }
  }
  @media screen and (max-width: 850px) {
    .creator-panels { grid-template-columns: 1fr; overflow-y: auto; }
    .panel { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); overflow-y: visible; }
    .creator-sub { display: none; }
  }
</style>
