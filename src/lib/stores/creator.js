import { writable } from "svelte/store";

// All available effects with their rarity/subtype mapping
export const EFFECTS = [
  { id: "basic",                label: "Basic",                  rarity: "Common",             subtypes: ["Basic"],           supertype: "pokémon" },
  { id: "reverse-holo",        label: "Reverse Holo",           rarity: "Common Reverse Holo", subtypes: ["Basic"],           supertype: "pokémon" },
  { id: "regular-holo",        label: "Holofoil Rare",          rarity: "Rare Holo",           subtypes: ["Basic"],           supertype: "pokémon" },
  { id: "cosmos-holo",         label: "Cosmos / Galaxy Holo",   rarity: "Rare Holo Cosmos",    subtypes: ["Basic"],           supertype: "pokémon" },
  { id: "amazing-rare",        label: "Amazing Rare",           rarity: "Amazing Rare",        subtypes: ["Basic"],           supertype: "pokémon" },
  { id: "radiant-holo",        label: "Radiant Holo",           rarity: "Radiant Rare",        subtypes: ["Radiant"],         supertype: "pokémon" },
  { id: "v-regular",           label: "Pokémon V",              rarity: "Rare Holo V",         subtypes: ["V"],               supertype: "pokémon" },
  { id: "v-full-art",          label: "Pokémon V Full Art",     rarity: "Rare Ultra",          subtypes: ["V"],               supertype: "pokémon" },
  { id: "v-max",               label: "VMax",                   rarity: "Rare Holo VMAX",      subtypes: ["VMAX"],            supertype: "pokémon" },
  { id: "v-star",              label: "VStar",                  rarity: "Rare Holo VSTAR",     subtypes: ["VSTAR"],           supertype: "pokémon" },
  { id: "trainer-full-art",    label: "Trainer Full Art",       rarity: "Rare Ultra",          subtypes: ["Supporter"],       supertype: "trainer" },
  { id: "trainer-gallery-holo",label: "Trainer Gallery Holo",   rarity: "Rare Holo",           subtypes: ["TG","Supporter"],  supertype: "trainer" },
  { id: "rainbow-holo",        label: "Rainbow Rare",           rarity: "Rare Rainbow",        subtypes: ["VMAX"],            supertype: "pokémon" },
  { id: "rainbow-alt",         label: "Rainbow Alt (VMax)",     rarity: "Rare Rainbow Alt",    subtypes: ["VMAX"],            supertype: "pokémon" },
  { id: "secret-rare",         label: "Secret Rare (Gold)",     rarity: "Rare Secret",         subtypes: ["Basic"],           supertype: "pokémon" },
  { id: "shiny-rare",          label: "Shiny Vault",            rarity: "Rare Shiny",          subtypes: ["Basic"],           supertype: "pokémon" },
];

export const TYPES = [
  "colorless", "fire", "water", "grass", "lightning",
  "psychic", "fighting", "darkness", "metal", "dragon", "fairy"
];

const defaultCard = {
  img: "",
  name: "My Card",
  types: ["colorless"],
  supertype: "pokémon",
  subtypes: ["Basic"],
  rarity: "Common",
  set: "swsh1",
  number: "001",
  id: "custom-001",
  isReverse: false,
};

const defaultSettings = {
  effectId: "basic",
  shineOpacity: 1,
  glareOpacity: 1,
  rotationMax: 15,
  cardScale: 1,
  showcaseMode: false,
};

function createCreatorStore() {
  const { subscribe, set, update } = writable({
    card: { ...defaultCard },
    settings: { ...defaultSettings },
    presets: [],
  });

  return {
    subscribe,
    setCardImage(img) {
      update(s => ({ ...s, card: { ...s.card, img } }));
    },
    setCardData(data) {
      update(s => ({ ...s, card: { ...s.card, ...data } }));
    },
    // Met à jour carte + effet en une seule opération atomique
    // pour éviter deux re-renders successifs (utilisé par l'import TCG)
    setCardDataWithEffect(cardData, effectId) {
      const effect = EFFECTS.find(e => e.id === effectId);
      update(s => ({
        ...s,
        settings: {
          ...s.settings,
          effectId: effect ? effectId : s.settings.effectId,
        },
        card: {
          ...s.card,
          ...cardData,
          ...(effect ? {
            rarity: effect.rarity,
            subtypes: effect.subtypes,
            supertype: effect.supertype,
            isReverse: effectId === "reverse-holo",
          } : {}),
        }
      }));
    },
    applyEffect(effectId) {
      const effect = EFFECTS.find(e => e.id === effectId);
      if (!effect) return;
      update(s => ({
        ...s,
        settings: { ...s.settings, effectId },
        card: {
          ...s.card,
          rarity: effect.rarity,
          subtypes: effect.subtypes,
          supertype: effect.supertype,
          isReverse: effectId === "reverse-holo",
        }
      }));
    },
    updateSetting(key, value) {
      update(s => ({ ...s, settings: { ...s.settings, [key]: value } }));
    },
    savePreset(name) {
      update(s => {
        const preset = { name, card: { ...s.card }, settings: { ...s.settings }, id: Date.now() };
        const presets = [...s.presets, preset];
        try { localStorage.setItem("creator-presets", JSON.stringify(presets)); } catch(e) {}
        return { ...s, presets };
      });
    },
    loadPreset(preset) {
      update(s => ({ ...s, card: { ...preset.card }, settings: { ...preset.settings } }));
    },
    deletePreset(id) {
      update(s => {
        const presets = s.presets.filter(p => p.id !== id);
        try { localStorage.setItem("creator-presets", JSON.stringify(presets)); } catch(e) {}
        return { ...s, presets };
      });
    },
    loadFromStorage() {
      try {
        const raw = localStorage.getItem("creator-presets");
        if (raw) {
          const presets = JSON.parse(raw);
          update(s => ({ ...s, presets }));
        }
      } catch(e) {}
    },
    reset() {
      set({ card: { ...defaultCard }, settings: { ...defaultSettings }, presets: [] });
    }
  };
}

export const creator = createCreatorStore();
