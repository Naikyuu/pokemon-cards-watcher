/**
 * Encode/decode creator state in URL hash
 * Format: #state=<base64url-encoded-json>
 */

export function encodeState(card, settings) {
  try {
    const slim = {
      c: {
        id:        card.id,
        name:      card.name,
        set:       card.set,
        number:    card.number,
        rarity:    card.rarity,
        supertype: card.supertype,
        subtypes:  card.subtypes,
        types:     card.types,
        img: card.img?.startsWith("http") ? card.img : "",
      },
      s: {
        effectId:     settings.effectId,
        shineOpacity: settings.shineOpacity,
        glareOpacity: settings.glareOpacity,
        rotationMax:  settings.rotationMax,
        cardScale:    settings.cardScale,
        showcaseMode: settings.showcaseMode,
      }
    };
    const json = JSON.stringify(slim);
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    return b64;
  } catch(e) { return ""; }
}

export function decodeState(hash) {
  try {
    const match = hash.match(/[#&]?state=([^&]*)/);
    if (!match) return null;
    const b64 = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "==".slice(0, (4 - b64.length % 4) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(json);
  } catch(e) { return null; }
}

export function applyUrlState(decoded, creator, EFFECTS) {
  if (!decoded) return;
  const { c, s } = decoded;
  if (c) {
    creator.setCardData({
      id:        c.id        || "custom-001",
      name:      c.name      || "My Card",
      set:       c.set       || "swsh1",
      number:    c.number    || "001",
      rarity:    c.rarity    || "Common",
      supertype: c.supertype || "pokémon",
      subtypes:  c.subtypes  || ["Basic"],
      types:     c.types     || ["colorless"],
      img:       c.img       || "",
    });
  }
  if (s?.effectId) creator.applyEffect(s.effectId);
  if (s) {
    if (s.shineOpacity  != null) creator.updateSetting("shineOpacity",  s.shineOpacity);
    if (s.glareOpacity  != null) creator.updateSetting("glareOpacity",  s.glareOpacity);
    if (s.rotationMax   != null) creator.updateSetting("rotationMax",   s.rotationMax);
    if (s.cardScale     != null) creator.updateSetting("cardScale",     s.cardScale);
    if (s.showcaseMode  != null) creator.updateSetting("showcaseMode",  s.showcaseMode);
  }
}
