import { writable, derived } from "svelte/store";
import { supabase, isSupabaseEnabled } from "../supabase.js";

// Store principal de session
const { subscribe, set, update } = writable({
  user: null,
  session: null,
  loading: true,
});

// Store dérivé pour l'état de connexion
export const isLoggedIn = derived(
  { subscribe },
  ($auth) => !!$auth.user
);

export const authStore = {
  subscribe,

  // Initialiser — écouter les changements de session
  async init() {
    if (!isSupabaseEnabled) {
      set({ user: null, session: null, loading: false });
      return;
    }
    // Récupérer la session existante
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, session, loading: false });

    // Écouter les changements
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session, loading: false });
    });
  },

  // Connexion email/password
  async signIn(email, password) {
    if (!isSupabaseEnabled) return { error: { message: "Supabase non configuré" } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  // Inscription email/password
  async signUp(email, password) {
    if (!isSupabaseEnabled) return { error: { message: "Supabase non configuré" } };
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  },

  // Connexion Google OAuth
  async signInWithGoogle() {
    if (!isSupabaseEnabled) return { error: { message: "Supabase non configuré" } };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  },

  // Déconnexion
  async signOut() {
    if (!isSupabaseEnabled) return;
    await supabase.auth.signOut();
    set({ user: null, session: null, loading: false });
  },

  // Réinitialisation mot de passe
  async resetPassword(email) {
    if (!isSupabaseEnabled) return { error: { message: "Supabase non configuré" } };
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
  },
};
