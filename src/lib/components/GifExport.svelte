<script>
  import { creator } from "../stores/creator.js";

  let exporting = false;
  let progress = 0;
  let statusMsg = "";
  let gifUrl = null;
  let frameCount = 30;
  let duration = 2;

  let quality = "medium";
  let useHtmlCapture = false; // toggle html2canvas vs canvas pur


  $: hasCard = !!$creator.card.img;
  $: cardName = $creator.card.name || "carte";
  $: dims = quality === "low" ? [168, 234] : quality === "medium" ? [252, 352] : [336, 469];

  // ── Encodeur GIF89a pur JS — avec Median Cut + Dithering ─
  function encodeGIF(frames, W, H, delay) {
    const DELAY = Math.max(2, Math.round(delay / 10));
    function word(n) { return [n & 0xFF, (n >> 8) & 0xFF]; }

    // Median Cut — génère une palette de 256 couleurs représentatives
    function medianCut(data, maxColors) {
      // Échantillonner les pixels (1 sur 4 pour la vitesse)
      const samples = [];
      for (let i = 0; i < data.length; i += 16) {
        samples.push([data[i], data[i+1], data[i+2]]);
      }

      function cut(pixels, depth) {
        if (depth === 0 || pixels.length === 0) {
          // Calculer la couleur moyenne du bucket
          let r=0,g=0,b=0;
          for (const p of pixels) { r+=p[0]; g+=p[1]; b+=p[2]; }
          const n = pixels.length || 1;
          return [[Math.round(r/n), Math.round(g/n), Math.round(b/n)]];
        }
        // Trouver le canal avec le plus grand écart
        let minR=255,maxR=0,minG=255,maxG=0,minB=255,maxB=0;
        for (const [r,g,b] of pixels) {
          if(r<minR)minR=r; if(r>maxR)maxR=r;
          if(g<minG)minG=g; if(g>maxG)maxG=g;
          if(b<minB)minB=b; if(b>maxB)maxB=b;
        }
        const rangeR=maxR-minR, rangeG=maxG-minG, rangeB=maxB-minB;
        const ch = rangeR>=rangeG && rangeR>=rangeB ? 0 : rangeG>=rangeB ? 1 : 2;
        pixels.sort((a,b) => a[ch]-b[ch]);
        const mid = pixels.length >> 1;
        return [
          ...cut(pixels.slice(0, mid), depth-1),
          ...cut(pixels.slice(mid), depth-1),
        ];
      }

      const depth = Math.ceil(Math.log2(maxColors));
      return cut(samples, depth);
    }

    // Trouver la couleur la plus proche dans la palette
    function nearest(pal, r, g, b) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < pal.length; i++) {
        const dr=r-pal[i][0], dg=g-pal[i][1], db=b-pal[i][2];
        // Pondération perceptuelle (l'oeil est plus sensible au vert)
        const d = dr*dr*0.299 + dg*dg*0.587 + db*db*0.114;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }

    function quantize(data) {
      // Générer la palette par Median Cut
      let pal = medianCut(data, 255);
      while (pal.length < 256) pal.push([0,0,0]);

      // Floyd-Steinberg dithering pour réduire les artifacts gris
      const buf = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) buf[i] = data[i];

      const pixels = new Uint8Array(W * (data.length / 4 / W));
      const rows = data.length / 4 / W;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const r = Math.max(0, Math.min(255, buf[idx]));
          const g = Math.max(0, Math.min(255, buf[idx+1]));
          const b = Math.max(0, Math.min(255, buf[idx+2]));

          const pi = nearest(pal, r, g, b);
          pixels[y * W + x] = pi;

          // Propager l'erreur (Floyd-Steinberg)
          const er = r - pal[pi][0];
          const eg = g - pal[pi][1];
          const eb = b - pal[pi][2];

          const spread = (dx, dy, f) => {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < W && ny < rows) {
              const ni = (ny * W + nx) * 4;
              buf[ni]   += er * f;
              buf[ni+1] += eg * f;
              buf[ni+2] += eb * f;
            }
          };
          spread(1,  0, 7/16);
          spread(-1, 1, 3/16);
          spread(0,  1, 5/16);
          spread(1,  1, 1/16);
        }
      }

      return { pixels: Array.from(pixels), pal };
    }
    function lzw(pixels, minCS) {
      const cc = 1 << minCS, eoc = cc + 1;
      let cs = minCS + 1, mc = 1 << cs;
      const tbl = new Map(), out = [];
      let buf = 0, bc = 0;
      const emit = code => { buf |= code << bc; bc += cs; while (bc >= 8) { out.push(buf & 0xFF); buf >>= 8; bc -= 8; } };
      const reset = () => { tbl.clear(); for (let i = 0; i < cc; i++) tbl.set(String(i), i); cs = minCS + 1; mc = 1 << cs; };
      reset(); emit(cc);
      let idx = cc + 2, prefix = String(pixels[0]);
      for (let i = 1; i < pixels.length; i++) {
        const key = prefix + ',' + pixels[i];
        if (tbl.has(key)) { prefix = key; }
        else {
          emit(tbl.get(prefix));
          if (idx < 4096) { tbl.set(key, idx++); if (idx > mc && cs < 12) { cs++; mc = 1 << cs; } }
          else { emit(cc); reset(); idx = cc + 2; }
          prefix = String(pixels[i]);
        }
      }
      emit(tbl.get(prefix)); emit(eoc);
      if (bc > 0) out.push(buf & 0xFF);
      return out;
    }
    function blocks(data) {
      const r = [];
      for (let i = 0; i < data.length; i += 255) { const c = data.slice(i, i+255); r.push(c.length, ...c); }
      return [...r, 0];
    }
    const b = [];
    b.push(0x47,0x49,0x46,0x38,0x39,0x61);
    b.push(...word(W), ...word(H));
    b.push(0xF7, 0x00, 0x00);
    for (let i = 0; i < 256; i++) b.push(0,0,0);
    b.push(0x21,0xFF,0x0B,78,69,84,83,67,65,80,69,50,46,48,0x03,0x01,0x00,0x00,0x00);
    for (const frame of frames) {
      const { pixels, pal } = quantize(frame);
      b.push(0x21,0xF9,0x04,0x00,...word(DELAY),0x00,0x00);
      b.push(0x2C,...word(0),...word(0),...word(W),...word(H),0x87);
      for (const [r,g,bv] of pal) b.push(r,g,bv);
      b.push(8,...blocks(lzw(pixels, 8)));
    }
    b.push(0x3B);
    return new Uint8Array(b);
  }

  // ── Capture html2canvas (vrai rendu CSS) ──────────────
  async function captureWithHtml2Canvas(cardEl, W, H, angle) {
    // cardEl = élément .card
    // On cible .card__rotator qui contient l'image + les effets
    const rotator = cardEl.querySelector(".card__rotator");
    const front   = cardEl.querySelector(".card__front") || rotator;
    const target  = rotator || cardEl;

    // Injecter les CSS vars de position de lumière
    const lx = 50 + Math.cos(angle) * 60;
    const ly = 50 + Math.sin(angle) * 55;
    const vars = {
      "--pointer-x":           `${lx}%`,
      "--pointer-y":           `${ly}%`,
      "--background-x":        `${20 + Math.cos(angle) * 20}%`,
      "--background-y":        `${20 + Math.sin(angle) * 20}%`,
      "--card-opacity":        "0.9",
      "--pointer-from-center": "0.6",
      "--rotate-x":            "0deg",   // neutralisé pour html2canvas
      "--rotate-y":            "0deg",   // neutralisé pour html2canvas
      "--card-scale":          "1",
      "--translate-x":         "0px",
      "--translate-y":         "0px",
    };
    for (const [k, v] of Object.entries(vars)) cardEl.style.setProperty(k, v);

    // Neutraliser temporairement le transform 3D sur le rotator
    // pour que html2canvas capture la carte à plat
    const prevTransform = rotator?.style.transform || "";
    const prevTransition = rotator?.style.transition || "";
    if (rotator) {
      rotator.style.transition = "none";
      rotator.style.transform  = "none";
    }

    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    const { default: html2canvas } = await import("html2canvas");

    const canvas = await html2canvas(target, {
      backgroundColor: null,
      scale: W / (target.offsetWidth || 240),
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: false,
    });

    // Restaurer le transform
    if (rotator) {
      rotator.style.transform  = prevTransform;
      rotator.style.transition = prevTransition;
    }

    // Dessiner sur un canvas aux bonnes dimensions
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#1a1b22";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(canvas, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H).data;
  }

  // ── Capture canvas pur (simulation) ───────────────────
  function captureCanvas(ctx, img, W, H, angle) {
    if (gifMode === "showcase") drawShowcase(ctx, img, W, H, angle);
    else drawHolo(ctx, img, W, H, angle);
    return ctx.getImageData(0, 0, W, H).data;
  }

  async function exportGif() {
    if (exporting || !hasCard) return;
    gifUrl = null; exporting = true; progress = 0;
    statusMsg = "Chargement...";

    try {
      const [W, H] = dims;
      const frameDelay = Math.round((duration * 1000) / frameCount);
      const cardImg = await loadImage($creator.card.img);

      // Canvas de secours pour la capture pure
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Trouver l'élément carte dans le DOM pour html2canvas
      const cardEl = document.querySelector(".card-container .card");

      const frames = [];

      for (let i = 0; i < frameCount; i++) {
        const angle = (i / frameCount) * Math.PI * 2;
        ctx.clearRect(0, 0, W, H);

        let frameData;
        if (useHtmlCapture && cardEl && gifMode === "holo") {
          try {
            frameData = await captureWithHtml2Canvas(cardEl, W, H, angle);
          } catch(e) {
            // Fallback canvas pur si html2canvas échoue
            frameData = captureCanvas(ctx, cardImg, W, H, angle);
          }
        } else {
          frameData = captureCanvas(ctx, cardImg, W, H, angle);
        }

        frames.push(frameData);
        progress = Math.round(((i+1)/frameCount)*78);
        statusMsg = `Frame ${i+1}/${frameCount}`;
        await new Promise(r => setTimeout(r, 0));
      }

      // Restaurer les styles CSS vars si html2canvas utilisé
      if (useHtmlCapture && cardEl) {
        ["--pointer-x","--pointer-y","--background-x","--background-y",
         "--card-opacity","--pointer-from-center","--rotate-x","--rotate-y",
         "--card-scale","--translate-x","--translate-y"
        ].forEach(v => cardEl.style.removeProperty(v));
        // Restaurer aussi le rotator si besoin
        const rotator = cardEl.querySelector(".card__rotator");
        if (rotator) { rotator.style.removeProperty("transform"); rotator.style.removeProperty("transition"); }
      }

      statusMsg = "Encodage GIF..."; progress = 80;
      await new Promise(r => setTimeout(r, 0));
      const gifBytes = encodeGIF(frames, W, H, frameDelay);
      gifUrl = URL.createObjectURL(new Blob([gifBytes], { type: "image/gif" }));
      progress = 100; statusMsg = "✅ GIF prêt !";

    } catch(err) {
      console.error(err);
      statusMsg = `⚠️ ${err.message}`;
    } finally {
      exporting = false;
    }
  }

  // ── Dessin canvas pur ─────────────────────────────────
  function drawHolo(ctx, img, W, H, angle) {
    ctx.fillStyle = "#1a1b22"; ctx.fillRect(0,0,W,H);
    roundedClip(ctx,0,0,W,H,8); ctx.drawImage(img,0,0,W,H); ctx.restore();
    const lx = W*.5+Math.cos(angle)*W*.65, ly = H*.5+Math.sin(angle)*H*.55;
    const h1 = ((angle*180)/Math.PI)%360;
    roundedClip(ctx,0,0,W,H,8);
    const shine = ctx.createRadialGradient(lx,ly,0,lx,ly,W*.95);
    shine.addColorStop(0,`hsla(${h1},100%,85%,0.65)`);
    shine.addColorStop(.25,`hsla(${(h1+60)%360},100%,75%,0.45)`);
    shine.addColorStop(.5,`hsla(${(h1+140)%360},100%,65%,0.2)`);
    shine.addColorStop(.8,`hsla(${(h1+220)%360},100%,55%,0.07)`);
    shine.addColorStop(1,"rgba(0,0,0,0)");
    ctx.globalCompositeOperation="screen"; ctx.fillStyle=shine; ctx.fillRect(0,0,W,H);
    const glare=ctx.createRadialGradient(lx,ly,0,lx,ly,W*.4);
    glare.addColorStop(0,"rgba(255,255,255,0.28)"); glare.addColorStop(.5,"rgba(255,255,255,0.07)"); glare.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=glare; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation="source-over"; ctx.restore();
  }



  function roundedClip(ctx,x,y,w,h,r){ ctx.save(); rRect(ctx,x,y,w,h,r); ctx.clip(); }
  function rRect(ctx,x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function loadImage(src) {
    return new Promise((res,rej) => {
      const img = new Image(); img.crossOrigin="anonymous";
      img.onload=()=>res(img);
      img.onerror=()=>{ const i2=new Image(); i2.onload=()=>res(i2); i2.onerror=rej; i2.src=src; };
      img.src=src;
    });
  }

  function downloadGif() {
    const a=document.createElement("a"); a.href=gifUrl; a.download=`${cardName}-${gifMode}.gif`; a.click();
  }
</script>

<div class="gif-box">
  <div class="gif-title">🎬 Export GIF animé</div>



  <div class="gif-settings">
    <div class="gif-setting">
      <label>Qualité <span class="val">{quality}</span></label>
      <div class="btn-group">
        {#each ["low","medium","high"] as q}
          <button class="q-btn" class:active={quality===q} on:click={()=>quality=q} disabled={exporting}>{q}</button>
        {/each}
      </div>
    </div>
    <div class="gif-setting">
      <label>Frames <span class="val">{frameCount}</span></label>
      <input type="range" min="18" max="60" step="6" bind:value={frameCount} disabled={exporting}/>
    </div>
    <div class="gif-setting">
      <label>Durée <span class="val">{duration}s</span></label>
      <input type="range" min="1" max="8" step="0.5" bind:value={duration} disabled={exporting}/>
    </div>

    <div class="capture-toggle">
      <label class="toggle-label">
        <input type="checkbox" bind:checked={useHtmlCapture} disabled={exporting}/>
        <span>Capture CSS réelle <span class="beta">beta</span></span>
      </label>
      <p class="toggle-hint">
        {useHtmlCapture
          ? "⚡ Capture les vrais effets holo CSS (sans rotation 3D)"
          : "🎨 Simulation canvas — rapide et stable"}
      </p>
    </div>

    <p class="size-hint">{dims[0]}×{dims[1]}px · {frameCount} frames · {duration}s</p>
  </div>

  {#if exporting}
    <div class="gif-progress">
      <div class="progress-bar"><div class="progress-fill" style="width:{progress}%"></div></div>
      <span class="progress-label">{statusMsg}</span>
    </div>
  {:else if gifUrl}
    <div class="gif-preview">
      <img src={gifUrl} alt="aperçu" class="gif-thumb"/>
      <button class="btn-download" on:click={downloadGif}>⬇️ Télécharger le GIF</button>
      <button class="btn-regen" on:click={()=>gifUrl=null}>✕ Nouveau</button>
    </div>
  {:else}
    <button class="btn-gif" on:click={exportGif} disabled={!hasCard}>
      {hasCard ? "🎬 Générer le GIF" : "Importe une carte d'abord"}
    </button>
    <p class="gif-hint">Lumière orbitale arc-en-ciel</p>
  {/if}
</div>

<style>
  .gif-box{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 14px;}
  .gif-title{font-size:13px;font-weight:bold;color:white;margin-bottom:10px;}
  .mode-tabs{display:flex;gap:4px;margin-bottom:10px;background:rgba(0,0,0,0.2);padding:3px;border-radius:8px;}
  .mode-tab{flex:1;padding:6px 8px;border:none;border-radius:6px;background:transparent;color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;}
  .mode-tab.active{background:rgba(255,255,255,0.1);color:white;}
  .gif-settings{display:flex;flex-direction:column;gap:8px;margin-bottom:10px;}
  .gif-setting label{display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px;}
  .val{color:var(--primary,#4dd9f0);font-weight:bold;}
  .gif-setting input[type="range"]{width:100%;accent-color:var(--primary,#4dd9f0);cursor:pointer;}
  .btn-group{display:flex;gap:4px;}
  .q-btn{flex:1;padding:4px 0;border:1px solid rgba(255,255,255,0.12);border-radius:5px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:11px;cursor:pointer;transition:all 0.2s;text-transform:capitalize;}
  .q-btn.active{background:rgba(77,217,240,0.15);border-color:rgba(77,217,240,0.4);color:var(--primary,#4dd9f0);}
  .q-btn:disabled{opacity:0.4;cursor:not-allowed;}

  .capture-toggle{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 10px;}
  .toggle-label{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:rgba(255,255,255,0.7);}
  .toggle-label input{accent-color:var(--primary,#4dd9f0);cursor:pointer;}
  .beta{font-size:9px;background:rgba(240,180,77,0.2);color:#f0b44d;border:1px solid rgba(240,180,77,0.3);border-radius:4px;padding:1px 4px;margin-left:2px;}
  .toggle-hint{font-size:10px;color:rgba(255,255,255,0.25);margin:4px 0 0;line-height:1.4;}

  /* ── Capture section ── */
  .size-hint{font-size:10px;color:rgba(255,255,255,0.2);margin:2px 0 0;text-align:center;}
  .btn-gif{width:100%;padding:10px;background:linear-gradient(135deg,rgba(240,180,77,0.2),rgba(240,140,77,0.1));border:1px solid rgba(240,180,77,0.4);color:#f0b44d;border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;transition:all 0.2s;}
  .btn-gif:hover:not(:disabled){background:linear-gradient(135deg,rgba(240,180,77,0.3),rgba(240,140,77,0.2));}
  .btn-gif:disabled{opacity:0.3;cursor:not-allowed;}
  .gif-hint{font-size:11px;color:rgba(255,255,255,0.2);text-align:center;margin:6px 0 0;}
  .gif-progress{display:flex;flex-direction:column;gap:6px;}
  .progress-bar{width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;}
  .progress-fill{height:100%;background:linear-gradient(90deg,#4dd9f0,#f0b44d);border-radius:3px;transition:width 0.15s ease;}
  .progress-label{font-size:12px;color:rgba(255,255,255,0.4);text-align:center;}
  .gif-preview{display:flex;flex-direction:column;align-items:center;gap:8px;}
  .gif-thumb{width:120px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);}
  .btn-download{width:100%;padding:8px;background:rgba(77,217,240,0.15);border:1px solid rgba(77,217,240,0.3);color:var(--primary,#4dd9f0);border-radius:7px;font-size:13px;font-weight:bold;cursor:pointer;transition:all 0.2s;}
  .btn-download:hover{background:rgba(77,217,240,0.25);}
  .btn-regen{font-size:12px;color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;}
  .btn-regen:hover{color:rgba(255,255,255,0.6);}
</style>
