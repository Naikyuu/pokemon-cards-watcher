# 🎴 Pokemon Cards CSS — avec Card Creator Hub

## Lancer le projet

```cmd
cd pokemon-cards-css-main
npm install
npm run dev
```

Ouvre **http://localhost:5173** dans ton navigateur.

---

## Nouveautés : Card Creator Hub

Un bouton **🎨 Ouvrir le Card Creator Hub** apparaît en haut de la galerie.

### Panneau gauche — Import
- Upload d'image locale (drag & drop ou fichier)
- Recherche via l'API Pokémon TCG (auto-détection de l'effet)

### Panneau central — Prévisualisation
- Carte interactive avec tous les effets holographiques en temps réel
- Slider de taille (60% → 160%)
- Mode Showcase (animation d'entrée tournante)
- Bouton Partager (encode l'état dans l'URL)
- Export PNG

### Panneau droit — 3 onglets

**Effets**
- 16 effets holographiques disponibles
- Sliders : shine, glare, rotation max
- Nom et type de la carte
- Presets sauvegardés en localStorage

**Données**
- Infos set : logo, série, date de sortie, nb de cartes, légalité
- Historique des prix : sparkline construit progressivement via localStorage
- Population gradée : liens directs PSA & CGC

**Export**
- Export PNG via html2canvas
- Export GIF animé (effet holo en rotation, réglable en frames/durée)

---

## Structure des fichiers ajoutés

```
src/
├── App.svelte                     ← modifié (bouton Creator Hub)
├── Creator.svelte                 ← nouveau (page principale du hub)
└── lib/
    ├── components/
    │   ├── Card.svelte            ← modifié (fix images base64/locales)
    │   ├── CardImport.svelte      ← nouveau
    │   ├── CardPreview.svelte     ← nouveau
    │   ├── EffectControls.svelte  ← nouveau
    │   ├── SetInfo.svelte         ← nouveau
    │   ├── PriceChart.svelte      ← nouveau
    │   ├── GradedPop.svelte       ← nouveau
    │   └── GifExport.svelte       ← nouveau
    ├── stores/
    │   └── creator.js             ← nouveau
    └── utils/
        └── urlState.js            ← nouveau
```
