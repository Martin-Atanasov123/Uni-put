// Генерира социални preview изображения (Open Graph + Twitter Card).
//
// Защо: преди това всичките 60+ страници използваха един и същ /university.png.
// Когато ученик сподели линк във Viber/Telegram/Facebook, всички preview-та
// изглеждаха еднакво. Per-page branded OG = +30-50% CTR от social shares.
//
// Стратегия: SVG шаблон на страница → rasterize до PNG чрез @resvg/resvg-js
// (pure WASM, без native bindings). Output: public/og/[slug].png (1200×630 — official OG spec).
//
// Стартирай ръчно: `npm run generate:og`. Не е в prebuild — изображенията
// се commit-ват веднъж и се регенерират само при дизайн промяна.

import { Resvg } from "@resvg/resvg-js";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "og");

// Шаблоните за всички страници. Headline + subtitle + accent цвят.
// Брандиране: cyan→violet gradient (signature на УниПът), Inter font, dark bg.
const PAGES = [
    {
        slug: "default",
        eyebrow: "УНИПЪТ",
        title: "Калкулатор за приемен бал",
        subtitle: "и кариерен ориентир за кандидат-студенти",
        accent: "#06B6D4",
    },
    {
        slug: "calculator",
        eyebrow: "КАЛКУЛАТОР",
        title: "Кандидатстудентски бал",
        subtitle: "Точните коефициенти за 845 специалности",
        accent: "#06B6D4",
    },
    {
        slug: "career-advisor",
        eyebrow: "RIASEC ТЕСТ",
        title: "Открий своето призвание",
        subtitle: "30 въпроса за 3 минути — безплатно",
        accent: "#8B5CF6",
    },
    {
        slug: "universities",
        eyebrow: "ВИСШИ УЧИЛИЩА",
        title: "51 университета",
        subtitle: "845 специалности за прием 2026",
        accent: "#06B6D4",
    },
    {
        slug: "dormitories",
        eyebrow: "СТУДЕНТСКИ ЖИВОТ",
        title: "68 общежития",
        subtitle: "В 16 града на България",
        accent: "#8B5CF6",
    },
    {
        slug: "about",
        eyebrow: "ЗА НАС",
        title: "УниПът",
        subtitle: "Твоят дигитален пътеводител към висшето образование",
        accent: "#8B5CF6",
    },
];

function svgTemplate({ eyebrow, title, subtitle, accent }) {
    // 1200×630 е официалното OG препоръчително съотношение.
    // Layout: left-aligned brand mark + headline; right-side ambient gradient orb.
    // Escape XML special chars в текстовете.
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#0B1120"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Ambient glow (right) -->
  <ellipse cx="950" cy="315" rx="400" ry="400" fill="url(#glow)"/>

  <!-- Dot grid pattern -->
  <g opacity="0.15">
    ${Array.from({ length: 30 }, (_, y) =>
        Array.from({ length: 60 }, (_, x) =>
            `<circle cx="${20 + x * 20}" cy="${20 + y * 20}" r="1" fill="#94A3B8"/>`
        ).join("")
    ).join("")}
  </g>

  <!-- Brand mark — gradient line + УниПът -->
  <g transform="translate(80, 110)">
    <rect x="0" y="-6" width="6" height="44" fill="url(#brand)" rx="3"/>
    <text x="22" y="26" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="900" fill="#F1F5F9" letter-spacing="-0.02em">УниПът</text>
  </g>

  <!-- Eyebrow -->
  <text x="80" y="260" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="${accent}" letter-spacing="0.18em">${esc(eyebrow)}</text>

  <!-- Title (headline) -->
  <text x="80" y="340" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="900" fill="#F1F5F9" letter-spacing="-0.03em">${esc(title)}</text>

  <!-- Subtitle -->
  <text x="80" y="400" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="500" fill="#94A3B8">${esc(subtitle)}</text>

  <!-- Footer URL -->
  <text x="80" y="560" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="600" fill="#64748B" letter-spacing="0.05em">uniput.eu</text>

  <!-- Right-side decorative gradient bar -->
  <rect x="1180" y="0" width="20" height="630" fill="url(#brand)"/>
</svg>`;
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`📁 Output: ${OUT_DIR}\n`);

    for (const page of PAGES) {
        const svg = svgTemplate(page);
        // Resvg рендерира с висока резолюция (по default fitTo: { mode: 'width', value: 1200 } за нашите SVG-и).
        const resvg = new Resvg(svg, {
            background: "#0F172A",
            fitTo: { mode: "width", value: 1200 },
            font: {
                // Системни fallback fontове — Inter не е инсталиран в Node env,
                // но Resvg ще използва най-близкия sans-serif. Кирилицата ще се рендерира коректно.
                loadSystemFonts: true,
            },
        });
        const pngBuffer = resvg.render().asPng();
        const outPath = resolve(OUT_DIR, `${page.slug}.png`);
        await writeFile(outPath, pngBuffer);
        const sizeKB = (pngBuffer.length / 1024).toFixed(1);
        console.log(`✅ ${page.slug.padEnd(15)} → ${sizeKB} KB`);
    }

    console.log(`\n✨ Generated ${PAGES.length} OG images.`);
}

main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
});
