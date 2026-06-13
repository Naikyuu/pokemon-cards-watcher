<script>
  import { authStore } from "../stores/auth.js";
  import { isSupabaseEnabled } from "../supabase.js";

  export let onClose = () => {};

  let mode = "login"; // "login" | "signup" | "reset"
  let email = "";
  let password = "";
  let loading = false;
  let error = "";
  let success = "";

  async function handleSubmit() {
    if (!email || (!password && mode !== "reset")) return;
    loading = true; error = ""; success = "";

    if (mode === "login") {
      const { error: err } = await authStore.signIn(email, password);
      if (err) { error = translateError(err.message); }
      else { onClose(); }

    } else if (mode === "signup") {
      const { error: err } = await authStore.signUp(email, password);
      if (err) { error = translateError(err.message); }
      else { success = "Compte créé ! Vérifie ton email pour confirmer."; }

    } else if (mode === "reset") {
      const { error: err } = await authStore.resetPassword(email);
      if (err) { error = translateError(err.message); }
      else { success = "Email de réinitialisation envoyé !"; }
    }

    loading = false;
  }

  async function handleGoogle() {
    loading = true; error = "";
    const { error: err } = await authStore.signInWithGoogle();
    if (err) { error = translateError(err.message); loading = false; }
    // Si succès, redirection automatique via OAuth
  }

  function translateError(msg) {
    if (msg.includes("Invalid login")) return "Email ou mot de passe incorrect";
    if (msg.includes("Email not confirmed")) return "Confirme ton email avant de te connecter";
    if (msg.includes("already registered")) return "Cet email est déjà utilisé";
    if (msg.includes("Password should")) return "Le mot de passe doit faire au moins 6 caractères";
    if (msg.includes("rate limit")) return "Trop de tentatives, réessaie dans quelques minutes";
    return msg;
  }

  function handleKey(e) {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") handleSubmit();
  }
</script>

<svelte:window on:keydown={handleKey}/>

<div class="auth-overlay" on:click={onClose} role="button" tabindex="-1">
  <div class="auth-modal" on:click|stopPropagation role="dialog" aria-modal="true">

    <!-- Header -->
    <div class="auth-header">
      <div class="auth-logo">🎴</div>
      <h2 class="auth-title">TCG Holo Lab</h2>
      <p class="auth-sub">
        {mode === "login"  ? "Connecte-toi pour synchroniser tes données" :
         mode === "signup" ? "Crée un compte pour sauvegarder dans le cloud" :
         "Réinitialise ton mot de passe"}
      </p>
      <button class="auth-close" on:click={onClose}>✕</button>
    </div>

    {#if !isSupabaseEnabled}
      <div class="auth-warning">
        ⚠️ Supabase non configuré — les comptes ne sont pas disponibles.<br/>
        Configure <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.
      </div>
    {:else}

      <!-- Google OAuth -->
      {#if mode !== "reset"}
        <button class="btn-google" on:click={handleGoogle} disabled={loading}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <div class="divider"><span>ou</span></div>
      {/if}

      <!-- Form -->
      <div class="auth-form">
        <div class="field">
          <label>Email</label>
          <input
            type="email"
            bind:value={email}
            placeholder="ton@email.com"
            disabled={loading}
            autocomplete="email"
          />
        </div>

        {#if mode !== "reset"}
          <div class="field">
            <label>Mot de passe</label>
            <input
              type="password"
              bind:value={password}
              placeholder="••••••••"
              disabled={loading}
              autocomplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
        {/if}

        {#if error}
          <p class="msg msg--error">❌ {error}</p>
        {/if}
        {#if success}
          <p class="msg msg--success">✅ {success}</p>
        {/if}

        <button class="btn-submit" on:click={handleSubmit} disabled={loading || !email}>
          {#if loading}
            <span class="spinner"></span>
          {:else if mode === "login"}
            Se connecter
          {:else if mode === "signup"}
            Créer un compte
          {:else}
            Envoyer le lien
          {/if}
        </button>
      </div>

      <!-- Footer links -->
      <div class="auth-footer">
        {#if mode === "login"}
          <button class="link-btn" on:click={() => { mode="signup"; error=""; success=""; }}>
            Pas de compte ? Créer un compte
          </button>
          <button class="link-btn" on:click={() => { mode="reset"; error=""; success=""; }}>
            Mot de passe oublié ?
          </button>
        {:else if mode === "signup"}
          <button class="link-btn" on:click={() => { mode="login"; error=""; success=""; }}>
            Déjà un compte ? Se connecter
          </button>
        {:else}
          <button class="link-btn" on:click={() => { mode="login"; error=""; success=""; }}>
            ← Retour à la connexion
          </button>
        {/if}
      </div>

    {/if}
  </div>
</div>

<style>
  .auth-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .auth-modal {
    background: hsl(220, 10%, 18%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 32px 28px;
    width: min(420px, 90vw);
    position: relative;
    animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

  .auth-header { text-align: center; margin-bottom: 24px; }
  .auth-logo { font-size: 36px; margin-bottom: 8px; }
  .auth-title { font-size: 22px; font-weight: 800; color: white; margin: 0 0 6px; font-family:"Roboto Condensed",sans-serif; }
  .auth-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0; }
  .auth-close {
    position: absolute; top: 16px; right: 16px;
    background: none; border: none; color: rgba(255,255,255,0.3);
    cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 6px;
    transition: all 0.2s;
  }
  .auth-close:hover { color: white; background: rgba(255,255,255,0.08); }

  .auth-warning {
    background: rgba(240,180,77,0.1);
    border: 1px solid rgba(240,180,77,0.3);
    border-radius: 8px; padding: 12px; font-size: 13px;
    color: rgba(240,180,77,0.9); line-height: 1.5;
  }
  .auth-warning code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; font-size: 11px; }

  .btn-google {
    width: 100%; padding: 11px 16px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: white; border: none; border-radius: 10px;
    color: #333; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    margin-bottom: 16px;
  }
  .btn-google:hover:not(:disabled) { background: #f5f5f5; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
  .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

  .divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px; color: rgba(255,255,255,0.2); font-size: 12px;
  }
  .divider::before, .divider::after { content:""; flex:1; height:1px; background:rgba(255,255,255,0.1); }

  .auth-form { display: flex; flex-direction: column; gap: 12px; }

  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 0.04em; }
  .field input {
    padding: 10px 14px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    color: white; font-size: 14px; outline: none;
    transition: border-color 0.2s;
  }
  .field input:focus { border-color: var(--primary,#4dd9f0); }
  .field input::placeholder { color: rgba(255,255,255,0.2); }
  .field input:disabled { opacity: 0.5; }

  .msg { font-size: 13px; margin: 0; padding: 8px 12px; border-radius: 7px; line-height: 1.4; }
  .msg--error { background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.2); color: hsl(0,80%,75%); }
  .msg--success { background: rgba(77,217,150,0.1); border: 1px solid rgba(77,217,150,0.2); color: hsl(150,70%,70%); }

  .btn-submit {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #4dd9f0, #7b6cf6);
    border: none; border-radius: 10px;
    color: #0a0b10; font-size: 15px; font-weight: 800;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: "Roboto Condensed", sans-serif; letter-spacing: 0.04em;
  }
  .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(77,217,240,0.3); }
  .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #0a0b10;
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-footer {
    margin-top: 16px; display: flex; flex-direction: column;
    align-items: center; gap: 6px;
  }
  .link-btn {
    background: none; border: none;
    color: rgba(255,255,255,0.35); font-size: 13px;
    cursor: pointer; transition: color 0.2s; padding: 2px;
  }
  .link-btn:hover { color: var(--primary,#4dd9f0); }
</style>
