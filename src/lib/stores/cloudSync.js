/**
 * Synchronisation cloud via Supabase
 * Gère presets, historique et favoris
 * Fallback localStorage si non connecté
 */
import { supabase, isSupabaseEnabled } from "../supabase.js";

// ── Presets ───────────────────────────────────────────────
export async function fetchPresets(userId) {
  if (!isSupabaseEnabled || !userId) return null;
  const { data, error } = await supabase
    .from("presets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchPresets:", error); return null; }
  return data.map(p => ({
    id: p.id,
    name: p.name,
    card: p.card_data,
    settings: p.settings_data,
  }));
}

export async function savePreset(userId, preset) {
  if (!isSupabaseEnabled || !userId) return null;
  const { data, error } = await supabase
    .from("presets")
    .insert({
      user_id: userId,
      name: preset.name,
      card_data: preset.card,
      settings_data: preset.settings,
    })
    .select()
    .single();
  if (error) { console.error("savePreset:", error); return null; }
  return { ...preset, id: data.id };
}

export async function deletePreset(userId, presetId) {
  if (!isSupabaseEnabled || !userId) return false;
  const { error } = await supabase
    .from("presets")
    .delete()
    .eq("id", presetId)
    .eq("user_id", userId);
  if (error) { console.error("deletePreset:", error); return false; }
  return true;
}

// ── Historique ────────────────────────────────────────────
export async function fetchHistory(userId) {
  if (!isSupabaseEnabled || !userId) return null;
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(20);
  if (error) { console.error("fetchHistory:", error); return null; }
  return data.map(h => ({
    id: h.card_id,
    name: h.card_data?.name,
    img: h.card_data?.img,
    rarity: h.card_data?.rarity,
    set: h.card_data?.set,
    number: h.card_data?.number,
    types: h.card_data?.types,
    supertype: h.card_data?.supertype,
    subtypes: h.card_data?.subtypes,
    viewedAt: new Date(h.viewed_at).getTime(),
  }));
}

export async function addToHistory(userId, card) {
  if (!isSupabaseEnabled || !userId || !card.id || card.id.startsWith("custom")) return;
  // Upsert — met à jour si la carte existe déjà
  await supabase.from("history").upsert({
    user_id: userId,
    card_id: card.id,
    card_data: {
      name: card.name,
      img: card.img?.startsWith("http") ? card.img : "",
      rarity: card.rarity,
      set: card.set,
      number: card.number,
      types: card.types,
      supertype: card.supertype,
      subtypes: card.subtypes,
    },
    viewed_at: new Date().toISOString(),
  }, { onConflict: "user_id,card_id" });
}

export async function clearHistory(userId) {
  if (!isSupabaseEnabled || !userId) return;
  await supabase.from("history").delete().eq("user_id", userId);
}

// ── Favoris ───────────────────────────────────────────────
export async function fetchFavorites(userId) {
  if (!isSupabaseEnabled || !userId) return null;
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchFavorites:", error); return null; }
  return data.map(f => ({
    id: f.card_id,
    name: f.card_data?.name,
    img: f.card_data?.img,
    rarity: f.card_data?.rarity,
    set: f.card_data?.set,
    number: f.card_data?.number,
    types: f.card_data?.types,
    supertype: f.card_data?.supertype,
    subtypes: f.card_data?.subtypes,
  }));
}

export async function toggleFavorite(userId, card) {
  if (!isSupabaseEnabled || !userId || !card.id) return false;
  // Vérifier si déjà en favori
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", card.id)
    .single();

  if (data) {
    // Supprimer
    await supabase.from("favorites").delete()
      .eq("user_id", userId).eq("card_id", card.id);
    return false;
  } else {
    // Ajouter
    await supabase.from("favorites").insert({
      user_id: userId,
      card_id: card.id,
      card_data: {
        name: card.name,
        img: card.img?.startsWith("http") ? card.img : "",
        rarity: card.rarity,
        set: card.set,
        number: card.number,
        types: card.types,
        supertype: card.supertype,
        subtypes: card.subtypes,
      },
    });
    return true;
  }
}

export async function isFavorite(userId, cardId) {
  if (!isSupabaseEnabled || !userId || !cardId) return false;
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .single();
  return !!data;
}
