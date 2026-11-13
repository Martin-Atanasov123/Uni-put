// Генерира public/sitemap.xml от Supabase данните.
// Стартира се през `npm run generate:sitemap` (използва `node --env-file=.env`
// локално; в Netlify env var-ите идват от dashboard-а).
//
// Защо отделен скрипт, а не статичен файл: списъкът с университети и
// специалности расте — ръчно поддържан sitemap бързо ще остарее.
//
// ВАЖНО: INCLUDE_DYNAMIC_ROUTES е изключено по подразбиране. Включи го САМО
// след като /universities/[slug] и /universities/[uni]/[specialty] route-ите
// са имплементирани, иначе ще пратиш Googlebot към 404-ки (noindex), което
// активно вреди на индексирането.

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { slugify } from "../src/lib/slugify.js";

// Минимален .env loader — без dotenv dependency. Локално чете .env, ако го има.
// В CI (Netlify) env vars идват директно от dashboard-а → файлът липсва → no-op.
async function loadDotEnvIfPresent(envPath) {
    if (!existsSync(envPath)) return;
    const content = await readFile(envPath, "utf8");
    for (const line of content.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const [, k, raw] = m;
        if (process.env[k]) continue; // вече зададена (CI има приоритет)
        process.env[k] = raw.replace(/^['"]|['"]$/g, "");
    }
}

const SITE_URL = "https://uniput.eu";
// ⚠ Включи (true или env SITEMAP_DYNAMIC=1) САМО след като per-slug pages са live.
const INCLUDE_DYNAMIC_ROUTES = process.env.SITEMAP_DYNAMIC === "1" || false;
// Само university-ниво URL-и. Изключи когато per-specialty pages са имплементирани.
const UNI_ONLY = process.env.SITEMAP_UNI_ONLY !== "0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "public", "sitemap.xml");

// Статични публични routes — индексируеми. Лични/auth/admin routes не са тук
// (те се пазят от robots.txt Disallow + Seo noindex).
const STATIC_ROUTES = [
    { path: "/",               changefreq: "weekly",  priority: "1.0" },
    { path: "/calculator",     changefreq: "weekly",  priority: "0.9" },
    { path: "/career-advisor", changefreq: "monthly", priority: "0.9" },
    { path: "/universities",   changefreq: "weekly",  priority: "0.8" },
    { path: "/specialnosti",   changefreq: "weekly",  priority: "0.8", dynamicOnly: true },
    { path: "/calendar",       changefreq: "weekly",  priority: "0.8" },
    { path: "/dormitories",    changefreq: "monthly", priority: "0.7" },
    { path: "/dzi-strateg",    changefreq: "monthly", priority: "0.7" },
    { path: "/priem-7-klas",   changefreq: "weekly",  priority: "0.8" },
    { path: "/about",          changefreq: "monthly", priority: "0.5" },
    { path: "/terms",          changefreq: "yearly",  priority: "0.3" },
    { path: "/privacy",        changefreq: "yearly",  priority: "0.3" },
];

// <lastmod> = датата на билда. Данните и prerender-натият HTML се регенерират от
// базата при всеки deploy, така че датата е вярна; Google ползва lastmod (а
// игнорира changefreq/priority), за да реши кога да обходи страницата отново.
const LASTMOD = new Date().toISOString().slice(0, 10);

function urlEntry({ path, changefreq, priority }) {
    // Trailing slash — Netlify 301-redirect-ва no-slash → slash, затова sitemap-ът
    // трябва да изброява реалните 200 URL-и (slash-версиите), не redirect-ите.
    const slashed = path === "/" ? "/" : "/" + path.replace(/^\/|\/$/g, "") + "/";
    return `  <url>
    <loc>${SITE_URL}${slashed}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchDynamicRoutes() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error(
            "Липсват VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Стартирай с " +
            "`node --env-file=.env scripts/generate-sitemap.mjs` или setni env vars."
        );
    }

    const supabase = createClient(url, key, {
        auth: { persistSession: false },
        // Node <22 няма native WebSocket — даваме `ws` като transport, иначе
        // Realtime клиентът чупи createClient(), макар че не го ползваме.
        realtime: { transport: WebSocket },
    });

    // Взимаме уникални комбинации university_name + specialty.
    // PostgREST капва на ~1000 rows per request (db-max-rows), независимо от
    // .limit() — затова пагинираме с .range(), иначе университети/специалности
    // след 1000-тия ред мълчаливо изпадат от sitemap-а.
    const PAGE = 1000;
    const allRows = [];
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
            .from("universities")
            .select("university_name, specialty")
            .range(from, from + PAGE - 1);
        if (error) throw new Error(`Supabase грешка: ${error.message}`);
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < PAGE) break;
    }

    const universities = new Map(); // uniSlug -> name (за дедупликация)
    const specialties = new Set();  // "uniSlug/specSlug" pairs
    const specUnis = new Map();     // specSlug -> Set(uniName) — за агрегатните /specialnosti/ страници

    for (const row of allRows) {
        const uniSlug = slugify(row.university_name);
        const specSlug = slugify(row.specialty);
        if (!uniSlug) continue;
        universities.set(uniSlug, row.university_name);
        if (specSlug) {
            specialties.add(`${uniSlug}/${specSlug}`);
            if (!specUnis.has(specSlug)) specUnis.set(specSlug, new Set());
            specUnis.get(specSlug).add(row.university_name);
        }
    }

    // Сортираме по slug: Supabase не гарантира ред, а несортираният изход дава
    // 48-редов diff при всяко регенериране, в който истинските промени се губят.
    const uniRoutes = [...universities.keys()].sort().map((slug) => ({
        path: `/universities/${slug}`,
        changefreq: "weekly",
        priority: "0.8",
    }));

    // Агрегатни per-специалност страници — САМО тези с ≥2 университета (същият
    // праг като prerender.mjs, иначе sitemap обещава URL-и без prerender-нат HTML).
    const aggSpecRoutes = [...specUnis.entries()]
        .filter(([, unis]) => unis.size >= 2)
        .map(([slug]) => slug)
        .sort()
        .map((slug) => ({ path: `/specialnosti/${slug}`, changefreq: "weekly", priority: "0.7" }));

    if (UNI_ONLY) return [...uniRoutes, ...aggSpecRoutes];

    const specRoutes = [...specialties].sort().map((pair) => ({
        path: `/universities/${pair}`,
        changefreq: "weekly",
        priority: "0.7",
    }));

    return [...uniRoutes, ...aggSpecRoutes, ...specRoutes];
}

async function main() {
    await loadDotEnvIfPresent(resolve(__dirname, "..", ".env"));

    // /specialnosti/ хъбът се prerender-ва само в dynamic режим (иска данни от базата).
    const routes = STATIC_ROUTES.filter((r) => INCLUDE_DYNAMIC_ROUTES || !r.dynamicOnly);

    if (INCLUDE_DYNAMIC_ROUTES) {
        console.log("📡 Извличам университети и специалности от Supabase…");
        const dynamic = await fetchDynamicRoutes();
        routes.push(...dynamic);
        console.log(`   + ${dynamic.length} dynamic routes`);
    } else {
        console.log("ℹ Dynamic routes са изключени (SITEMAP_DYNAMIC≠1).");
        console.log("  В Netlify е включено; локално сетни SITEMAP_DYNAMIC=1, ако искаш пълен sitemap.");
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(urlEntry).join("\n")}
</urlset>
`;

    // ПРЕДПАЗИТЕЛ: `npm run build` върти този скрипт. Локално SITEMAP_DYNAMIC
    // обикновено не е сетнат (в Netlify е), затова един най-обикновен локален
    // билд презаписваше комитнатия sitemap от 60 URL-а на 10 — и ако след това
    // комитнеш, деплойваш осакатен sitemap, без нищо да се е оплакало.
    // Отказваме да смалим съществуващ файл; продукцията се пише само когато
    // dynamic режимът наистина е включен.
    const existingCount = await countExistingUrls(OUT_PATH);
    if (!INCLUDE_DYNAMIC_ROUTES && existingCount > routes.length) {
        console.log(
            `⏭  Пропуснат запис: ${OUT_PATH} вече има ${existingCount} URL-а, ` +
            `а без dynamic режим щяхме да запишем само ${routes.length}.`
        );
        console.log("   Пусни с SITEMAP_DYNAMIC=1, ако наистина искаш да го регенерираш.");
        return;
    }

    await writeFile(OUT_PATH, xml, "utf8");
    console.log(`✅ Записан ${OUT_PATH} (${routes.length} URL-и)`);
}

// Колко URL-а има вече записаният sitemap (0, ако липсва или е нечетим).
async function countExistingUrls(path) {
    try {
        return ((await readFile(path, "utf8")).match(/<url>/g) || []).length;
    } catch {
        return 0;
    }
}

main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
});
