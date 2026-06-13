<script>
  import { authStore, isLoggedIn } from "../stores/auth.js";
  import { fetchFavorites, fetchPresets, fetchHistory } from "../stores/cloudSync.js";
  import { creator } from "../stores/creator.js";

  export let onShowAuth = () => {};

  let showMenu = false;
  let syncing = false;
  let syncMsg = "";

  $: user = null;
  $: authStore.subscribe(s => user = s.user);

  $: avatar = user?.user_metadata?.avatar_url || null;
  $: displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Profil";

  async function syncAll() {
    if (!user) return;
    syncing = true; syncMsg = "";
    try {
      // Sync presets
      const cloudPresets = await fetchPresets(user.id);
      if (cloudPresets) {
        creator.update(s => ({ ...s, presets: cloudPresets }));
      }
      // Sync historique
      const cloudHistory = await fetchHistory(user.id);
      if (cloudHistory) {
        try { localStorage.setItem("card-history", JSON.stringify(cloudHistory)); } catch(e) {}
      }
      syncMsg = "✅ Synchronisé !";
    } catch(e) {
      syncMsg = "⚠️ Erreur de sync";
    }
    syncing = false;
    setTimeout(() => syncMsg = "", 3000);
  }

  function handleSignOut() {
    authStore.signOut();
    showMenu = false;
  }

  function handleClickOutside(e) {
    if (!e.target.closest(".user-menu-wrap")) showMenu = false;
  }
</script>

<svelte:window on:click={handleClickOutside}/>

{#if $isLoggedIn}
  <div class="user-menu-wrap">
    <button class="user-btn" on:click|stopPropagation={() => showMenu = !showMenu}>
      {#if avatar}
        <img src={avatar} alt={displayName} class="user-avatar"/>
      {:else}
        <div class="user-initials">{displayName[0].toUpperCase()}</div>
      {/if}
      <span class="user-name">{displayName}</span>
      <span class="chevron" class:open={showMenu}>▾</span>
    </button>

    {#if showMenu}
      <div class="user-dropdown" on:click|stopPropagation>
        <div class="dropdown-user">
          <span class="dropdown-name">{displayName}</span>
          <span class="dropdown-email">{user.email}</span>
        </div>

        <div class="dropdown-divider"></div>

        <button class="dropdown-item" on:click={syncAll} disabled={syncing}>
          {syncing ? "⏳ Sync..." : "🔄 Synchroniser le cloud"}
        </button>
        {#if syncMsg}
          <p class="sync-msg">{syncMsg}</p>
        {/if}

        <div class="dropdown-divider"></div>

        <button class="dropdown-item dropdown-item--danger" on:click={handleSignOut}>
          🚪 Se déconnecter
        </button>
      </div>
    {/if}
  </div>
{:else}
  <button class="signin-btn" on:click={onShowAuth}>
    👤 Se connecter
  </button>
{/if}

<style>
  .user-menu-wrap { position: relative; }

  .user-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    color: white; cursor: pointer; font-size: 13px;
    transition: all 0.2s;
  }
  .user-btn:hover { background: rgba(255,255,255,0.12); }

  .user-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    object-fit: cover;
  }
  .user-initials {
    width: 24px; height: 24px; border-radius: 50%;
    background: linear-gradient(135deg, #4dd9f0, #7b6cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #0a0b10;
    flex-shrink: 0;
  }
  .user-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chevron { font-size: 10px; opacity: 0.5; transition: transform 0.2s; }
  .chevron.open { transform: rotate(180deg); }

  .user-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: hsl(220,10%,16%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 6px;
    min-width: 200px; z-index: 1000;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: dropDown 0.15s ease;
  }
  @keyframes dropDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

  .dropdown-user { padding: 8px 10px 10px; }
  .dropdown-name { display: block; font-size: 14px; font-weight: 700; color: white; }
  .dropdown-email { display: block; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; }

  .dropdown-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0; }

  .dropdown-item {
    width: 100%; padding: 8px 10px;
    background: none; border: none; border-radius: 7px;
    color: rgba(255,255,255,0.7); font-size: 13px;
    cursor: pointer; text-align: left; transition: all 0.15s;
  }
  .dropdown-item:hover:not(:disabled) { background: rgba(255,255,255,0.07); color: white; }
  .dropdown-item:disabled { opacity: 0.4; cursor: not-allowed; }
  .dropdown-item--danger { color: rgba(255,100,100,0.7); }
  .dropdown-item--danger:hover { background: rgba(255,100,100,0.08); color: hsl(0,80%,70%); }

  .sync-msg { font-size: 11px; color: rgba(255,255,255,0.4); margin: 2px 10px 4px; }

  .signin-btn {
    padding: 7px 16px;
    background: linear-gradient(135deg, rgba(77,217,240,0.15), rgba(123,108,246,0.15));
    border: 1px solid rgba(77,217,240,0.3);
    border-radius: 20px; color: var(--primary,#4dd9f0);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }
  .signin-btn:hover {
    background: linear-gradient(135deg, rgba(77,217,240,0.25), rgba(123,108,246,0.25));
    box-shadow: 0 4px 16px rgba(77,217,240,0.15);
  }
</style>
