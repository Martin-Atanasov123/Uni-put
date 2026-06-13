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
    { path: "/dormitories",    changefreq: "monthly", priority: "0.7" },
    { path: "/about",          changefreq: "monthly", priority: "0.5" },
    { path: "/terms",          changefreq: "yearly",  priority: "0.3" },
    { path: "/privacy",        changefreq: "yearly",  priority: "0.3" },
];

function urlEntry({ path, changefreq, priority }) {
    return `  <url>
    <loc>${SITE_URL}${path}</loc>
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

    for (const row of allRows) {
        const uniSlug = slugify(row.university_name);
        const specSlug = slugify(row.specialty);
        if (!uniSlug) continue;
        universities.set(uniSlug, row.university_name);
        if (specSlug) specialties.add(`${uniSlug}/${specSlug}`);
    }

    const uniRoutes = [...universities.keys()].map((slug) => ({
        path: `/universities/${slug}`,
        changefreq: "weekly",
        priority: "0.8",
    }));

    if (UNI_ONLY) return uniRoutes;

    const specRoutes = [...specialties].map((pair) => ({
        path: `/universities/${pair}`,
        changefreq: "weekly",
        priority: "0.7",
    }));

    return [...uniRoutes, ...specRoutes];
}

async function main() {
    await loadDotEnvIfPresent(resolve(__dirname, "..", ".env"));

    const routes = [...STATIC_ROUTES];

    if (INCLUDE_DYNAMIC_ROUTES) {
        console.log("📡 Извличам университети и специалности от Supabase…");
        const dynamic = await fetchDynamicRoutes();
        routes.push(...dynamic);
        console.log(`   + ${dynamic.length} dynamic routes`);
    } else {
        console.log("ℹ Dynamic routes са изключени (INCLUDE_DYNAMIC_ROUTES=false).");
        console.log("  Включи ги САМО след като /universities/[slug] е имплементиран.");
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(urlEntry).join("\n")}
</urlset>
`;

    await writeFile(OUT_PATH, xml, "utf8");
    console.log(`✅ Записан ${OUT_PATH} (${routes.length} URL-и)`);
}

main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
});
