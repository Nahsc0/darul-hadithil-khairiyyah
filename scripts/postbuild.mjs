import { writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const url =
  process.env.SITE_URL || "https://nahsc0.github.io/darul-hadithil-khairiyyah/";
const html = await readFile("dist/index.html", "utf8");
const org = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Darul Hadithil Khairiyyah",
  url,
  telephone: ["+2348062292438", "+2347038889325"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kabama Layout",
    addressLocality: "Zaria",
    addressRegion: "Kaduna State",
    addressCountry: "NG",
  },
};
const hash = createHash("sha256").update(JSON.stringify(org)).digest("base64");
const backend = process.env.VITE_SUPABASE_URL
  ? new URL(process.env.VITE_SUPABASE_URL).origin
  : "";
const csp = `default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' ${backend}; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'`;
const extra = `<meta http-equiv="Content-Security-Policy" content="${csp}"/><meta name="referrer" content="strict-origin-when-cross-origin"/><link rel="icon" href="./assets/originals/mosque-logo.jpeg"/><link rel="canonical" href="${url}"/><meta property="og:title" content="Darul Hadithil Khairiyyah"/><meta property="og:description" content="Knowledge. Worship. Community. Weekly lectures and community events in Zaria."/><meta property="og:image" content="${url}assets/originals/mosque-logo.jpeg"/><meta property="og:type" content="website"/><meta property="og:url" content="${url}"/><script type="application/ld+json">${JSON.stringify(org)}</script>`;
await writeFile("dist/index.html", html.replace("</head>", extra + "</head>"));
await writeFile("dist/404.html", html.replace("</head>", extra + "</head>"));
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${url}sitemap.xml\n`,
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}</loc></url></urlset>`,
);
await writeFile("dist/.nojekyll", "");
