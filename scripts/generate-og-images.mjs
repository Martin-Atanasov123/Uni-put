// Генерира социални preview изображения (Open Graph + Twitter Card), 1200×630.
//
// Дизайн (редизайн, ноември 2026): плътен тъмен фон, кехлибарен акцент, Source Serif 4 за
// заглавието и Source Sans 3 за текста — същото като в сайта. Без градиенти и орбове.
//
// Шрифтовете са статични TTF в scripts/og-fonts/ (Resvg не чете woff2). Логото е
// scripts/og-fonts/logo-amber.png (изрязана и намалена версия на public/logo-wordmark.png).
//
// Стартирай ръчно: `npm run generate:og`. Не е в prebuild — PNG-тата се commit-ват и се
// регенерират само при промяна на дизайна или на числата в siteStats.

import { UNIVERSITIES, SPECIALTIES, DORMITORIES, DORMITORY_CITIES, ADMISSION_YEAR_SHORT } from "../src/lib/siteStats.js";

import { Resvg } from "@resvg/resvg-js";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "og");
const FONT_DIR = resolve(__dirname, "og-fonts");

const BG = "#0E1525";
const ACCENT = "#F5B544";
const TEXT = "#EEF1F7";
const MUTED = "#94A3B8";

const PAGES = [
    { slug: "default", eyebrow: "УНИПЪТ", title: "Калкулатор за приемен бал", subtitle: "и кариерен ориентир за кандидат-студенти" },
    { slug: "calculator", eyebrow: "КАЛКУЛАТОР", title: "Кандидатстудентски бал", subtitle: `Точните коефициенти за ${SPECIALTIES} специалности` },
    { slug: "career-advisor", eyebrow: "RIASEC ТЕСТ", title: "Открий своето призвание", subtitle: "30 въпроса за 3 минути — безплатно" },
    { slug: "universities", eyebrow: "ВИСШИ УЧИЛИЩА", title: `${UNIVERSITIES} университета`, subtitle: `${SPECIALTIES} специалности за прием ${ADMISSION_YEAR_SHORT}` },
    { slug: "dormitories", eyebrow: "СТУДЕНТСКИ ЖИВОТ", title: `${DORMITORIES} общежития`, subtitle: `В ${DORMITORY_CITIES} града на България` },
    { slug: "about", eyebrow: "ЗА НАС", title: "УниПът", subtitle: "Твоят дигитален пътеводител към висшето образование" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Балансиран пренос: до 2 реда, режем на думата най-близо до средата (без „сираче“ от една дума).
function wrap(text, max = 22) {
    if (text.length <= max) return [text];
    const words = text.split(" ");
    let best = null;
    for (let i = 1; i < words.length; i++) {
        const l1 = words.slice(0, i).join(" ");
        const l2 = words.slice(i).join(" ");
        const diff = Math.abs(l1.length - l2.length);
        if (!best || diff < best.diff) best = { lines: [l1, l2], diff };
    }
    return best ? best.lines : [text];
}

function svgTemplate({ eyebrow, title, subtitle }, logoB64) {
    const lines = wrap(title);
    const titleY = 330;
    const lh = 88;
    const subY = titleY + (lines.length - 1) * lh + 70;
    const logoW = 190;
    const logoH = Math.round((logoW * 443) / 520);
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>

  <!-- Точкова решетка -->
  <g opacity="0.12">
    ${Array.from({ length: 32 }, (_, y) =>
        Array.from({ length: 60 }, (_, x) => `<circle cx="${20 + x * 20}" cy="${20 + y * 20}" r="1" fill="${MUTED}"/>`).join("")
    ).join("")}
  </g>

  <!-- Път: две тънки линии в долния десен ъгъл -->
  <g fill="none" stroke="${ACCENT}" stroke-linecap="round">
    <path d="M520 700 C 700 560, 820 640, 960 470 S 1140 300, 1260 330" stroke-width="2" opacity="0.30"/>
    <path d="M600 720 C 780 600, 900 680, 1040 520 S 1200 380, 1280 410" stroke-width="1.5" opacity="0.16"/>
  </g>

  <!-- Лого -->
  <image x="${1200 - 80 - logoW}" y="56" width="${logoW}" height="${logoH}" xlink:href="data:image/png;base64,${logoB64}"/>

  <!-- Надпис над заглавието -->
  <text x="80" y="238" font-family="UP Sans Bold" font-size="24" fill="${ACCENT}" letter-spacing="3.2">${esc(eyebrow)}</text>

  <!-- Заглавие -->
  ${lines.map((l, i) => `<text x="80" y="${titleY + i * lh}" font-family="UP Serif" font-size="80" fill="${TEXT}" letter-spacing="-1.4">${esc(l)}</text>`).join("\n  ")}

  <!-- Подзаглавие -->
  <text x="80" y="${subY}" font-family="UP Sans" font-size="34" fill="${MUTED}">${esc(subtitle)}</text>

  <!-- Адрес -->
  <text x="80" y="570" font-family="UP Sans Bold" font-size="22" fill="${MUTED}" letter-spacing="1.1">uniput.eu</text>
</svg>`;
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    const logoB64 = (await readFile(resolve(FONT_DIR, "logo-amber.png"))).toString("base64");
    const fontFiles = ["SourceSerif4-ExtraBold.ttf", "SourceSans3-Bold.ttf", "SourceSans3-Regular.ttf"].map((f) => resolve(FONT_DIR, f));
    console.log(`📁 Output: ${OUT_DIR}\n`);

    for (const page of PAGES) {
        const resvg = new Resvg(svgTemplate(page, logoB64), {
            background: BG,
            fitTo: { mode: "width", value: 1200 },
            font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "UP Sans" },
        });
        const png = resvg.render().asPng();
        await writeFile(resolve(OUT_DIR, `${page.slug}.png`), png);
        console.log(`✅ ${page.slug.padEnd(15)} → ${(png.length / 1024).toFixed(1)} KB`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
