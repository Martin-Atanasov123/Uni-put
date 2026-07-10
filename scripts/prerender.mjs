// Static head-injection prerender за SPA SEO.
//
// ПРОБЛЕМ КОЙТО РЕШАВА:
// Netlify сервира един и същ dist/index.html за всеки route. Преди това raw
// HTML-ът имаше статичен canonical href="/" → Google виждаше всяка страница
// като "alternate" на началната и я деиндексираше (GSC: "Alternate page with
// proper canonical tag"). Google рендерира JS, но взема canonical решението в
// ПЪРВИЯ (raw HTML) pass, преди React да инжектира per-route тагове.
//
// РЕШЕНИЕ:
// Генерираме отделен dist/[route]/index.html за всеки публичен route, с правилен
// SELF-canonical + per-route title/description/OG в суровия HTML. Netlify сервира
// реални статични файлове ПРЕДИ SPA fallback redirect-а, затова /calculator →
// dist/calculator/index.html (правилен head), а React app-ът работи нормално.
//
// Per-uni routes (47) са gated зад SITEMAP_DYNAMIC=1 (нужен е Supabase), точно
// както sitemap скрипта. Стартира се след `vite build` (виж package.json).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { slugify } from "../src/lib/slugify.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const SITE_URL = "https://uniput.eu";
const SITE_NAME = "УниПът";
const DEFAULT_IMAGE = `${SITE_URL}/og/default.png`;
const INCLUDE_DYNAMIC = process.env.SITEMAP_DYNAMIC === "1";

// ── Статични публични routes — keep in sync с <Seo> props в компонентите ──
// (canonical се деривира от path → нула риск от разминаване;
//  title/description се копират от компонентите.)
const STATIC_ROUTES = [
    {
        path: "/",
        title: "УниПът — Калкулатор за приемен бал и кариерен ориентир за кандидат-студенти",
        description: "Изчисли своя кандидатстудентски бал по МОН формулите, открий подходящи специалности с RIASEC тест и сравни 51 университета — безплатно, на едно място. За 2026 г.",
        image: DEFAULT_IMAGE,
    },
    {
        path: "/calculator",
        title: "Кандидатстудентски бал калкулатор — Балообразуване по МОН формули",
        description: "Изчисли своя кандидатстудентски бал за 2026 г. Калкулаторът прилага точните коефициенти и формули за балообразуване от МОН — за 51 университета и 845 специалности. Безплатно, без регистрация.",
        image: `${SITE_URL}/og/calculator.png`,
    },
    {
        path: "/career-advisor",
        title: "Безплатен RIASEC кариерен тест — Открий подходящата специалност",
        description: "Направи безплатния RIASEC кариерен тест — 30 въпроса за около 3 минути. Алгоритъмът сравнява профила ти с 912 специалности и 1002 кариери, за да открие най-подходящите. Без регистрация.",
        image: `${SITE_URL}/og/career-advisor.png`,
    },
    {
        path: "/universities",
        title: "Висши училища в България — 51 университета, 845 специалности за прием 2026",
        description: "Виж всички 51 висши училища в България и техните 845 специалности. Филтрирай по град, факултет или степен. Изчисли приемния си бал за 2026 г. с точните коефициенти от МОН.",
        image: `${SITE_URL}/og/universities.png`,
    },
    {
        path: "/dormitories",
        title: "Студентски общежития в България — 68 блока, цени и условия за 2026",
        description: "Сравни 68 студентски общежития в 16 града. Месечен наем, депозит, разстояние до университета и транспортни линии — на едно място. Данни към 2026 г.",
        image: `${SITE_URL}/og/dormitories.png`,
    },
    {
        path: "/calendar",
        title: "Календар за прием 2026 — изпити, срокове и класирания по университети",
        description: "Всички важни дати за прием 2026 на едно място: кандидатстудентски изпити, срокове за подаване на документи, класирания и записвания по университети. Данни от официалните източници.",
        image: DEFAULT_IMAGE,
    },
    {
        path: "/about",
        title: "За нас",
        description: "Защо създадохме УниПът — безплатна платформа, която помага на българските кандидат-студенти да изчислят бал, открият кариера и сравнят университети.",
        image: `${SITE_URL}/og/about.png`,
    },
    {
        path: "/terms",
        title: "Условия за ползване",
        description: "Условия за ползване на УниПът — безплатна платформа за изчисляване на приемен бал и кариерно ориентиране. Какво обещаваме и какви са правата ти като потребител.",
        image: DEFAULT_IMAGE,
    },
    {
        path: "/privacy",
        title: "Политика за поверителност",
        description: "Как УниПът събира, използва и защитава личните ти данни — в съответствие с GDPR.",
        image: DEFAULT_IMAGE,
    },
];

// XML/HTML escape за атрибутни стойности.
const esc = (s) =>
    String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

// Изгражда per-route head таговете. Маркирани data-seo-default → React <Seo>
// компонентът ги премахва при hydration и инжектира идентични → нула дубликати.
function buildHead({ path, title, description, image }) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    // Trailing slash — съвпада с Netlify's 200 URL (no-slash 301-redirect-ва).
    const canonical = `${SITE_URL}${path === "/" ? "/" : "/" + path.replace(/^\/|\/$/g, "") + "/"}`;
    return [
        `<title data-seo-default>${esc(fullTitle)}</title>`,
        `<meta data-seo-default name="description" content="${esc(description)}" />`,
        `<link data-seo-default rel="canonical" href="${esc(canonical)}" />`,
        `<meta data-seo-default name="robots" content="index,follow" />`,
        `<meta data-seo-default property="og:type" content="website" />`,
        `<meta data-seo-default property="og:site_name" content="${SITE_NAME}" />`,
        `<meta data-seo-default property="og:locale" content="bg_BG" />`,
        `<meta data-seo-default property="og:url" content="${esc(canonical)}" />`,
        `<meta data-seo-default property="og:title" content="${esc(fullTitle)}" />`,
        `<meta data-seo-default property="og:description" content="${esc(description)}" />`,
        `<meta data-seo-default property="og:image" content="${esc(image)}" />`,
        `<meta data-seo-default name="twitter:card" content="summary_large_image" />`,
        `<meta data-seo-default name="twitter:title" content="${esc(fullTitle)}" />`,
        `<meta data-seo-default name="twitter:description" content="${esc(description)}" />`,
        `<meta data-seo-default name="twitter:image" content="${esc(image)}" />`,
    ].join("\n    ");
}

// Премахва съществуващите data-seo-default тагове от shell-а и вмъква новите.
function injectHead(shell, headTags) {
    let html = shell;
    // Махни стария title с data-seo-default
    html = html.replace(/<title\b[^>]*\bdata-seo-default\b[^>]*>[\s\S]*?<\/title>/g, "");
    // Махни старите meta/link с data-seo-default (void елементи)
    html = html.replace(/<(?:meta|link)\b[^>]*\bdata-seo-default\b[^>]*>/g, "");
    // Вмъкни новите точно преди </head>
    return html.replace(/<\/head>/i, `    ${headTags}\n  </head>`);
}

async function loadDotEnvIfPresent(envPath) {
    if (!existsSync(envPath)) return;
    const content = await readFile(envPath, "utf8");
    for (const line of content.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const [, k, raw] = m;
        if (process.env[k]) continue;
        process.env[k] = raw.replace(/^['"]|['"]$/g, "");
    }
}

// Дърпа per-uni метаданни от Supabase (само ако SITEMAP_DYNAMIC=1).
async function fetchUniversityRoutes() {
    const { createClient } = await import("@supabase/supabase-js");
    const WebSocket = (await import("ws")).default;
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.warn("⚠ Липсват Supabase env vars — пропускам per-uni prerender.");
        return [];
    }
    const supabase = createClient(url, key, {
        auth: { persistSession: false },
        realtime: { transport: WebSocket },
    });

    // PostgREST капва на ~1000 rows per request (db-max-rows), независимо от
    // .limit(). Таблицата има 1200+ rows, затова пагинираме с .range() —
    // иначе университетите се отрязват и брояч faculties/specialties е грешен.
    const PAGE = 1000;
    const allRows = [];
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
            .from("universities")
            .select("university_name, faculty, city")
            .range(from, from + PAGE - 1);
        if (error) {
            console.warn(`⚠ Supabase грешка — пропускам per-uni: ${error.message}`);
            return [];
        }
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < PAGE) break;
    }

    // Групиране по университет → faculties count, total rows, primary city.
    const byUni = new Map();
    for (const row of allRows) {
        const name = row.university_name;
        if (!name) continue;
        if (!byUni.has(name)) byUni.set(name, { faculties: new Set(), total: 0, cities: new Map() });
        const u = byUni.get(name);
        u.faculties.add(row.faculty || "Общи специалности");
        u.total += 1;
        if (row.city) u.cities.set(row.city, (u.cities.get(row.city) || 0) + 1);
    }

    const routes = [];
    for (const [name, u] of byUni) {
        const slug = slugify(name);
        if (!slug) continue;
        const facCount = u.faculties.size;
        const total = u.total;
        const primaryCity = [...u.cities.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        // Шаблоните трябва да съвпадат с UniversityPage.jsx seoTitle / seoDesc.
        const title = `Прием в ${name} 2026 — Балообразуване, ${facCount} факултета, ${total} специалности`;
        const description = `Подготвяш се за ${name}? Виж точните коефициенти за балообразуване по МОН за всичките ${total} специалности в ${facCount} факултета. Изчисли своя приемен бал за 2026 г. — безплатно, без регистрация.${primaryCity ? ` Кампусът е в ${primaryCity}.` : ""}`;
        routes.push({ path: `/universities/${slug}`, title, description, image: DEFAULT_IMAGE });
    }
    return routes;
}

async function main() {
    await loadDotEnvIfPresent(resolve(__dirname, "..", ".env"));

    const shellPath = resolve(DIST, "index.html");
    if (!existsSync(shellPath)) {
        throw new Error("dist/index.html липсва — пусни `vite build` първо.");
    }
    const shell = await readFile(shellPath, "utf8");

    let routes = [...STATIC_ROUTES];
    if (INCLUDE_DYNAMIC) {
        console.log("📡 Дърпам per-uni метаданни от Supabase…");
        const uniRoutes = await fetchUniversityRoutes();
        routes.push(...uniRoutes);
        console.log(`   + ${uniRoutes.length} per-uni routes`);
    } else {
        console.log("ℹ Per-uni prerender изключен (SITEMAP_DYNAMIC≠1).");
    }

    let written = 0;
    for (const route of routes) {
        // "/" вече е dist/index.html — презаписваме го с правилния head също.
        const outDir = route.path === "/" ? DIST : resolve(DIST, `.${route.path}`);
        await mkdir(outDir, { recursive: true });
        const html = injectHead(shell, buildHead(route));
        await writeFile(resolve(outDir, "index.html"), html, "utf8");
        written++;
    }

    console.log(`✅ Prerendered ${written} routes → dist/[route]/index.html`);
}

main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
});
