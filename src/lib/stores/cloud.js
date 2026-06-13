/**
 * Store cloud — synchronise presets, favoris et historique
 * avec Supabase. Fonctionne aussi en mode offline (localStorage).
 */
import { writable, get } from "svelte/store";
import { supabase } from "../supabase.js";
import { user } from "./auth.js";

export const cloudPresets   = writable([]);
export const cloudFavorites = writable([]);
export const cloudHistory   = writable([]);
export const cloudSyncing   = writable(false);

// ── Presets ───────────────────────────────────────────────

export async function loadPresets() {
  const u = get(user);
  if (!supabase || !u) return;
  const { data } = await supabase
    .from("presets")
    .select("*")
    .eq("user_id", u.id)
    .order("created_at", { ascending: false });
  if (data) cloudPresets.set(data);
}

export async function savePreset(name, card, settings) {
  const u = get(user);
  if (!supabase || !u) {
    // Fallback localStorage
    const raw = localStorage.getItem("creator-presets");
    const presets = raw ? JSON.parse(raw) : [];
    presets.unshift({ id: Date.now(), name, card, settings });
    localStorage.setItem("creator-presets", JSON.stringify(presets.slice(0, 30)));
    return;
  }
  cloudSyncing.set(true);
  const { data, error } = await supabase
    .from("presets")
    .insert({ user_id: u.id, name, card, settings })
    .select()
    .single();
  if (data) cloudPresets.update(p => [data, ...p]);
  cloudSyncing.set(false);
  return { error: error?.message };
}

export async function deletePreset(id) {
  const u = get(user);
  if (!supabase || !u) {
    const raw = localStorage.getItem("creator-presets");
    const presets = (raw ? JSON.parse(raw) : []).filter(p => p.id !== id);
    localStorage.setItem("creator-presets", JSON.stringify(presets));
    return;
  }
  await supabase.from("presets").delete().eq("id", id).eq("user_id", u.id);
  cloudPresets.update(p => p.filter(x => x.id !== id));
}

// ── Favoris ───────────────────────────────────────────────

export async function loadFavorites() {
  const u = get(user);
  if (!supabase || !u) return;
  const { data } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", u.id)
    .order("added_at", { ascending: false });
  if (data) cloudFavorites.set(data);
}

export async function toggleFavorite(card) {
  const u = get(user);
  const favs = get(cloudFavorites);
  const existing = favs.find(f => f.card_id === card.id);

  if (!supabase || !u) {
    // Fallback localStorage
    const raw = localStorage.getItem("card-favorites");
    let list = raw ? JSON.parse(raw) : [];
    if (existing) {
      list = list.filter(f => f.card_id !== card.id);
    } else {
      list.unshift({ card_id: card.id, card_name: card.name, card_img: card.img, card_rarity: card.rarity });
    }
    localStorage.setItem("card-favorites", JSON.stringify(list));
    cloudFavorites.set(list);
    return;
  }

  cloudSyncing.set(true);
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    cloudFavorites.update(f => f.filter(x => x.card_id !== card.id));
  } else {
    const { data } = await supabase.from("favorites").insert({
      user_id:     u.id,
      card_id:     card.id,
      card_name:   card.name,
      card_img:    card.img?.startsWith("http") ? card.img : "",
      card_rarity: card.rarity,
      card_set:    card.set,
    }).select().single();
    if (data) cloudFavorites.update(f => [data, ...f]);
  }
  cloudSyncing.set(false);
}

export function isFavorite(cardId) {
  return get(cloudFavorites).some(f => f.card_id === cardId);
}

// ── Historique ────────────────────────────────────────────

export async function loadHistory() {
  const u = get(user);
  if (!supabase || !u) return;
  const { data } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", u.id)
    .order("viewed_at", { ascending: false })
    .limit(20);
  if (data) cloudHistory.set(data);
}

export async function addToHistory(card) {
  const u = get(user);
  if (!card.id || card.id.startsWith("custom")) return;

  if (!supabase || !u) {
    // Géré par CardHistory.svelte via localStorage
    return;
  }

  // Upsert — met à jour viewed_at si la carte existe déjà
  await supabase.from("history").upsert({
    user_id:   u.id,
    card_id:   card.id,
    card_name: card.name,
    card_img:  card.img?.startsWith("http") ? card.img : "",
    card_rarity: card.rarity,
    card_set:  card.set,
    card_data: { types: card.types, supertype: card.supertype, subtypes: card.subtypes, number: card.number },
    viewed_at: new Date().toISOString(),
  }, { onConflict: "user_id,card_id" });

  loadHistory();
}

// ── Migration localStorage → cloud ───────────────────────

export async function migrateFromLocalStorage() {
  const u = get(user);
  if (!supabase || !u) return;

  // Migrer les presets
  try {
    const raw = localStorage.getItem("creator-presets");
    if (raw) {
      const localPresets = JSON.parse(raw);
      if (localPresets.length > 0) {
        const rows = localPresets.map(p => ({
          user_id:  u.id,
          name:     p.name,
          card:     p.card,
          settings: p.settings,
        }));
        await supabase.from("presets").upsert(rows, { ignoreDuplicates: true });
        localStorage.removeItem("creator-presets");
        await loadPresets();
      }
    }
  } catch(e) { console.warn("Migration presets:", e); }

  // Migrer les favoris localStorage
  try {
    const raw = localStorage.getItem("card-favorites");
    if (raw) {
      const localFavs = JSON.parse(raw);
      if (localFavs.length > 0) {
        const rows = localFavs.map(f => ({
          user_id:   u.id,
          card_id:   f.card_id,
          card_name: f.card_name,
          card_img:  f.card_img || "",
          card_rarity: f.card_rarity || "",
        }));
        await supabase.from("favorites").upsert(rows, { onConflict: "user_id,card_id", ignoreDuplicates: true });
        localStorage.removeItem("card-favorites");
        await loadFavorites();
      }
    }
  } catch(e) { console.warn("Migration favoris:", e); }
}
