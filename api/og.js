// Vercel Edge Function — génère les meta Open Graph dynamiquement
// URL: /api/og?name=Pikachu&img=https://...&rarity=Rare+Holo
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const name    = url.searchParams.get("name")   || "TCG Holo Lab";
  const img     = url.searchParams.get("img")    || "";
  const rarity  = url.searchParams.get("rarity") || "";
  const effect  = url.searchParams.get("effect") || "";
  const siteUrl = url.origin;

  const title       = name ? `${name} — TCG Holo Lab` : "TCG Holo Lab";
  const description = [rarity, effect].filter(Boolean).join(" · ") || "Explore les effets holographiques des cartes Pokémon";
  const image       = img || `${siteUrl}/thumb.png`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}"/>
  <meta property="og:title" content="${escHtml(title)}"/>
  <meta property="og:description" content="${escHtml(description)}"/>
  <meta property="og:image" content="${escHtml(image)}"/>
  <meta property="og:type" content="website"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escHtml(title)}"/>
  <meta name="twitter:description" content="${escHtml(description)}"/>
  <meta name="twitter:image" content="${escHtml(image)}"/>
  <meta http-equiv="refresh" content="0;url=${escHtml(siteUrl)}${escHtml(url.hash || "")}"/>
</head>
<body>Redirection...</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
