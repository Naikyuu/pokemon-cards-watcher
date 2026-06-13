<script>
  export let onEnter = () => {};

  // Toutes les cartes dispo pour le fond
  const cards = [
    "swsh12pt5/160","sm10/33","sm115/7","swsh12/127","swsh12/85","swsh12/116",
    "pgo/24","pgo/29","pgo/12","swsh1/85","swsh9/132","pgo/43","swsh45/60",
    "pgo/11","swsh12/59","swsh12/120","swsh11tg/TG03","swsh11tg/TG05",
    "swsh12tg/TG02","swsh7/110","swsh12/138","pgo/49","swsh8/250","swsh3/183",
    "swsh12/176","swsh8/245","swsh11/186","swsh10/177","swsh7/29","swsh45/51",
    "swsh9/29","swsh8/270","swsh8/271","swsh7/215","pgo/31","swsh9/18",
    "swsh6/196","swsh9/167","swsh1/200","swsh11tg/TG27","swsh12tg/TG26",
    "swsh4/188","swsh12/197","swsh10/204","swsh8/268","swsh9/175","swsh12/205",
    "swsh2/209","swsh9/186","swsh10/213","swsh8/280","swsh9/184",
    "swsh9tg/TG16","swsh9tg/TG18","swsh9tg/TG17","swsh9tg/TG19",
    "swsh9/120","swsh12/49","swsh8/138","pgo/68","swsh1/173","swsh9/150",
    "swsh4/9","swsh4/50","swsh4/82","swsh4/102","swsh4/119","swsh4/138",
    "swsh45/17","swsh45/21","swsh45/46","swsh45sv/SV093","swsh45sv/SV094",
    "swsh45sv/SV110","swsh45sv/SV023","swsh45sv/SV076","swsh45sv/SV107",
    "swsh12/176","swsh8/245","swsh11/186","swsh10/177","swsh7/215","pgo/31",
  ];

  // Génère une grille de cartes avec positions aléatoires mais déterministes
  function seededRand(seed) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  }

  const COLS = 9;
  const ROWS = 6;
  const total = COLS * ROWS;
  const rand = seededRand(42);

  const grid = Array.from({ length: total }, (_, i) => {
    const card = cards[i % cards.length];
    const rot = (rand() - 0.5) * 24;
    const delay = rand() * 2.5;
    const scale = 0.82 + rand() * 0.28;
    const brightness = 0.55 + rand() * 0.35;
    return { card, rot, delay, scale, brightness };
  });

  let entered = false;

  function handleEnter() {
    entered = true;
    setTimeout(onEnter, 700);
  }
</script>

<div class="landing" class:exiting={entered}>

  <!-- Grille de cartes en fond -->
  <div class="cards-bg">
    {#each grid as item, i}
      <div
        class="bg-card"
        style="
          --rot: {item.rot}deg;
          --delay: {item.delay}s;
          --scale: {item.scale};
          --brightness: {item.brightness};
        "
      >
        <img
          src="https://images.pokemontcg.io/{item.card}.png"
          alt=""
          loading="lazy"
          draggable="false"
        />
      </div>
    {/each}
  </div>

  <!-- Overlay gradient -->
  <div class="overlay"></div>

  <!-- Contenu central -->
  <div class="hero">
    <div class="hero__badge">Pokémon TCG</div>
    <h1 class="hero__title">
      <span class="hero__title-line">TCG</span>
      <span class="hero__title-line hero__title-line--accent">HOLO</span>
      <span class="hero__title-line">LAB</span>
    </h1>
    <p class="hero__sub">Explore les effets holographiques des cartes Pokémon</p>
    <button class="hero__btn" on:click={handleEnter}>
      <span class="btn__text">ENTRER</span>
      <span class="btn__shine"></span>
    </button>
  </div>

</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Rajdhani:wght@600;700&display=swap');

  .landing {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #0a0b10;
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .landing.exiting {
    opacity: 0;
    transform: scale(1.05);
    pointer-events: none;
  }

  /* ── Grille de cartes ── */
  .cards-bg {
    position: absolute;
    inset: -10%;
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 10px;
    padding: 20px;
  }

  .bg-card {
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(var(--rot)) scale(var(--scale));
    filter: brightness(var(--brightness)) saturate(0.9);
    animation: floatIn 1s ease both;
    animation-delay: var(--delay);
    transition: filter 0.4s ease, transform 0.4s ease;
  }

  .bg-card:hover {
    filter: brightness(calc(var(--brightness) + 0.3)) saturate(1.3);
    transform: rotate(calc(var(--rot) * 0.3)) scale(calc(var(--scale) + 0.1));
    z-index: 2;
  }

  .bg-card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 6px;
    display: block;
    user-select: none;
  }

  @keyframes floatIn {
    from { opacity: 0; transform: rotate(var(--rot)) scale(calc(var(--scale) - 0.15)) translateY(20px); }
    to   { opacity: 1; transform: rotate(var(--rot)) scale(var(--scale)) translateY(0); }
  }

  /* ── Overlay ── */
  .overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 80% at 50% 50%, rgba(10,11,16,0.55) 0%, rgba(10,11,16,0.92) 70%),
      radial-gradient(ellipse 100% 40% at 50% 0%, rgba(77,217,240,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 100% 40% at 50% 100%, rgba(180,77,240,0.06) 0%, transparent 60%);
  }

  /* ── Hero ── */
  .hero {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 10;
  }

  .hero__badge {
    font-family: 'Rajdhani', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(77,217,240,0.7);
    border: 1px solid rgba(77,217,240,0.25);
    padding: 5px 16px;
    border-radius: 20px;
    background: rgba(77,217,240,0.05);
    animation: fadeUp 0.8s ease 0.2s both;
  }

  .hero__title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    margin: 0;
    line-height: 0.9;
    animation: fadeUp 0.8s ease 0.4s both;
  }

  .hero__title-line {
    font-family: 'Black Han Sans', sans-serif;
    font-size: clamp(64px, 12vw, 140px);
    color: white;
    letter-spacing: -0.02em;
    text-shadow:
      0 0 80px rgba(255,255,255,0.08),
      0 2px 0 rgba(0,0,0,0.5);
  }

  .hero__title-line--accent {
    color: transparent;
    -webkit-text-stroke: 2px rgba(77,217,240,0.8);
    text-shadow:
      0 0 40px rgba(77,217,240,0.3),
      0 0 80px rgba(77,217,240,0.15);
  }

  .hero__sub {
    font-family: 'Rajdhani', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    margin: 0;
    animation: fadeUp 0.8s ease 0.6s both;
  }

  /* ── Bouton ── */
  .hero__btn {
    position: relative;
    margin-top: 12px;
    padding: 0;
    width: 180px;
    height: 56px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    overflow: hidden;
    background: linear-gradient(135deg, #4dd9f0, #7b6cf6);
    animation: fadeUp 0.8s ease 0.8s both;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .hero__btn:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 20px 60px rgba(77,217,240,0.35), 0 0 0 1px rgba(77,217,240,0.3);
  }

  .hero__btn:active {
    transform: scale(0.98);
  }

  .btn__text {
    position: relative;
    z-index: 2;
    font-family: 'Black Han Sans', sans-serif;
    font-size: 22px;
    letter-spacing: 0.15em;
    color: #0a0b10;
  }

  .btn__shine {
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    transform: skewX(-20deg);
    animation: btnShine 3s ease-in-out 1.5s infinite;
  }

  @keyframes btnShine {
    0%   { left: -100%; }
    30%  { left: 150%; }
    100% { left: 150%; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .cards-bg { grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(8, 1fr); }
    .hero__sub { font-size: 12px; }
    .hero__btn { width: 150px; height: 48px; }
    .btn__text { font-size: 18px; }
  }
</style>
