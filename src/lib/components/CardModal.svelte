<script>
  import { onMount, onDestroy } from "svelte";
  import { creator } from "../stores/creator.js";
  import Card from "./Card.svelte";

  export let onClose = () => {};

  $: card = $creator.card;
  $: imgKey = card.img ? (card.img.slice(0, 80) + String(card.img.length)) : "empty";
  $: cardKey = imgKey + "||" + card.rarity + "||" + card.id + "||modal";

  // Fermer avec Escape
  function handleKey(e) {
    if (e.key === "Escape") onClose();
  }

  onMount(() => {
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKey);
    document.body.style.overflow = "";
  });
</script>

<!-- Overlay cliquable pour fermer -->
<div class="modal-overlay" on:click={onClose} role="button" tabindex="-1">

  <!-- Conteneur carte — stoppe la propagation pour ne pas fermer au clic sur la carte -->
  <div class="modal-card" on:click|stopPropagation>
    {#key cardKey}
      <Card
        id={card.id}
        name={card.name}
        img={card.img}
        number={card.number}
        set={card.set}
        types={card.types}
        supertype={card.supertype}
        subtypes={card.subtypes}
        rarity={card.rarity}
        showcase={true}
      />
    {/key}
  </div>

  <!-- Bouton fermer -->
  <button class="modal-close" on:click={onClose} title="Fermer (Echap)">✕</button>

  <!-- Hint -->
  <p class="modal-hint">Clic en dehors ou Echap pour fermer</p>

</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
    cursor: pointer;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal-card {
    width: min(380px, 55vw);
    cursor: default;
    /* overflow visible obligatoire pour que l'effet holo et le zoom
       ne soient jamais clippés — c'est le but de la modale */
    overflow: visible;
    position: relative;
    z-index: 10000;
    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes scaleIn {
    from { transform: scale(0.7); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .modal-close {
    position: fixed;
    top: 20px;
    right: 24px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  }

  .modal-close:hover {
    background: rgba(255,255,255,0.18);
    color: white;
    transform: scale(1.1);
  }

  .modal-hint {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    pointer-events: none;
    white-space: nowrap;
  }
</style>
