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
// Per-uni routes са gated зад SITEMAP_DYNAMIC=1 (нужен е Supabase), точно
// както sitemap скрипта. Стартира се след `vite build` (виж package.json).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { UNIVERSITIES, SPECIALTIES, RIASEC_SPECIALTIES, DORMITORIES, DORMITORY_CITIES, ADMISSION_YEAR_SHORT } from "../src/lib/siteStats.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { slugify } from "../src/lib/slugify.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const SITE_URL = "https://uniput.eu";
const SITE_NAME = "УниПът";
const DEFAULT_IMAGE = `${SITE_URL}/og/default.png`;
const INCLUDE_DYNAMIC = process.env.SITEMAP_DYNAMIC === "1";

// Sitewide structured data (Organization + WebSite). Инжектира се в СУРОВИЯ HTML
// на всяка страница, за да го виждат и ботове без JS (AI crawlers, first-wave
// Googlebot). React <JsonLd> добавя per-page schema при hydration; маркерът
// data-seo-default кара <Seo> да премахне тази при mount → нула дубликати.
const ORG_SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/university.png`,
            description: "Безплатна платформа за изчисляване на кандидатстудентски бал и кариерно ориентиране на български кандидат-студенти",
            areaServed: { "@type": "Country", name: "България" },
            knowsAbout: ["Балообразуване", "Кандидатстудентски бал", "RIASEC кариерен тест", "Висше образование в България"],
        },
        { "@type": "WebSite", url: SITE_URL, name: SITE_NAME, inLanguage: "bg-BG" },
    ],
};

// ── Статични публични routes — keep in sync с <Seo> props в компонентите ──
// (canonical се деривира от path → нула риск от разминаване;
//  title/description се копират от компонентите.)
const STATIC_ROUTES = [
    {
        path: "/",
        title: "Калкулатор за приемен бал и кариерен тест",
        description: `Изчисли приемния си бал по МОН формулите, направи RIASEC кариерен тест и сравни ${UNIVERSITIES} университета — безплатно, на едно място. За ${ADMISSION_YEAR_SHORT} г.`,
        image: DEFAULT_IMAGE,
    },
    {
        path: "/calculator",
        title: "Калкулатор за приемен бал — балообразуване по МОН",
        description: `Изчисли приемния си бал за ${ADMISSION_YEAR_SHORT} г. Точните коефициенти и формули на МОН за ${UNIVERSITIES} университета и ${SPECIALTIES} специалности. Безплатно, без регистрация.`,
        image: `${SITE_URL}/og/calculator.png`,
    },
    {
        path: "/career-advisor",
        title: "Безплатен RIASEC кариерен тест за специалност",
        description: `Безплатен RIASEC кариерен тест — 30 въпроса за 3 минути. Сравняваме профила ти с ${RIASEC_SPECIALTIES} специалности, за да откриеш най-подходящите. Без регистрация.`,
        image: `${SITE_URL}/og/career-advisor.png`,
    },
    {
        path: "/universities",
        title: `${UNIVERSITIES} университета и ${SPECIALTIES} специалности за прием ${ADMISSION_YEAR_SHORT}`,
        description: `${UNIVERSITIES} висши училища в България и ${SPECIALTIES} специалности. Филтрирай по град, факултет и степен. Изчисли приемния си бал по коефициентите на МОН.`,
        image: `${SITE_URL}/og/universities.png`,
    },
    {
        path: "/dormitories",
        title: `${DORMITORIES} студентски общежития в България за ${ADMISSION_YEAR_SHORT}`,
        description: `Сравни ${DORMITORIES} студентски общежития в ${DORMITORY_CITIES} града. Месечен наем, депозит, разстояние до университета и транспортни линии — на едно място. Данни към ${ADMISSION_YEAR_SHORT} г.`,
        image: `${SITE_URL}/og/dormitories.png`,
    },
    {
        // Keep in sync с <Seo> props в DziStrategist.jsx.
        path: "/dzi-strateg",
        title: "Кой втори ДЗИ да избера — ДЗИ Стратег",
        description: "Виж кой втори държавен зрелостен изпит отваря най-много специалности в българските университети. Безплатно, по официалните формули за балообразуване.",
        image: DEFAULT_IMAGE,
    },
    {
        path: "/calendar",
        title: "Календар за прием 2026 — изпити и срокове",
        description: "Всички дати за прием 2026: изпити, срокове за кандидатстване, класирания и записвания по университети. Данни от официалните източници.",
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

// JSON-LD не се HTML-escape-ва (JSON е literal вътре в <script>), но `<` трябва
// да се неутрализира, за да не може стойност от базата да затвори тага рано.
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

// Изгражда per-route head таговете. Маркирани data-seo-default → React <Seo>
// компонентът ги премахва при hydration и инжектира идентични → нула дубликати.
function buildHead({ path, title, description, image, schemas }) {
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
        // Sitewide Organization/WebSite + (per-uni) EducationalOrganization,
        // BreadcrumbList. React <JsonLd> ги пресъздава при mount; маркерът
        // data-seo-default гарантира, че тези тук се махат → нула дубликати.
        ...[ORG_SCHEMA, ...(schemas || [])].map(
            (s) => `<script type="application/ld+json" data-seo-default>${jsonLd(s)}</script>`,
        ),
    ].join("\n    ");
}

// Премахва съществуващите data-seo-default тагове от shell-а и вмъква новите.
function injectHead(shell, headTags) {
    let html = shell;
    // Махни стария title с data-seo-default
    html = html.replace(/<title\b[^>]*\bdata-seo-default\b[^>]*>[\s\S]*?<\/title>/g, "");
    // Махни старите ld+json скриптове — иначе повторно пускане на скрипта (или
    // shell, който вече е минал през него) трупа дублирани schema блокове.
    html = html.replace(/<script\b[^>]*\bdata-seo-default\b[^>]*>[\s\S]*?<\/script>/g, "");
    // Махни старите meta/link с data-seo-default (void елементи)
    html = html.replace(/<(?:meta|link)\b[^>]*\bdata-seo-default\b[^>]*>/g, "");
    // Вмъкни новите точно преди </head>
    return html.replace(/<\/head>/i, `    ${headTags}\n  </head>`);
}

// H1 текст per route (по-подходящ като заглавие от <title>). Fallback: route.title.
const PAGE_H1 = {
    "/": "УниПът — калкулатор за приемен бал и кариерен тест",
    "/calculator": "Калкулатор за приемен бал 2026",
    "/career-advisor": "Безплатен RIASEC кариерен тест",
    "/universities": "Висши училища в България за прием 2026",
    "/dormitories": "Студентски общежития в България",
    "/dzi-strateg": "Кой втори ДЗИ да избера",
    "/calendar": "Календар за прием 2026",
    "/about": "За УниПът",
    "/terms": "Условия за ползване",
    "/privacy": "Политика за поверителност",
};

// Вътрешни връзки — помагат на crawl depth (одитът отбеляза слабо internal linking).
const SEO_LINKS = [
    { href: "/calculator/", text: "Калкулатор за приемен бал" },
    { href: "/career-advisor/", text: "Кариерен тест" },
    { href: "/universities/", text: "Университети" },
    { href: "/calendar/", text: "Календар за прием" },
    { href: "/dormitories/", text: "Студентски общежития" },
];

// Изгражда реално съдържание за суровия HTML. Инжектира се В #root;
// #initial-loader (z-9999, непрозрачен) го покрива за потребителите, а React
// (createRoot) го замества при mount → без мигване. Ботовете без JS (AI crawlers,
// first-wave Googlebot) четат текста от DOM.
//
// ВАЖНО — anti-cloaking: текстът тук трябва да ОГЛЕДАЛНО съвпада с това, което
// React рендира за същия route. При промяна в UniversityPage.jsx / Universities.jsx
// обнови и този файл, иначе Google вижда разминаване prerender ↔ rendered.
const WRAP_OPEN =
    `<div style="max-width:1152px;margin:0 auto;padding:96px 24px;color:#e2e8f0;` +
    `font-family:system-ui,-apple-system,sans-serif;line-height:1.6">`;

function navLinks(selfHref) {
    return SEO_LINKS
        .filter((l) => l.href !== selfHref)
        .map((l) => `<a href="${l.href}">${esc(l.text)}</a>`)
        .join(" · ");
}

const plural = (n, one, many) => (n === 1 ? one : many);

// Хъб страницата /universities/ — изброява ВСИЧКИ университети като реални <a>.
// Без това per-uni страниците са orphan-и в суровия HTML (откриваеми само през
// sitemap), а Google силно обезценява страници без вътрешни връзки към тях.
function buildUniversitiesIndexBody(route, uniIndex) {
    const items = uniIndex
        .map((u) => {
            const meta = [u.primaryCity, `${u.totalSpecialties} ${plural(u.totalSpecialties, "специалност", "специалности")}`]
                .filter(Boolean)
                .join(" · ");
            return `<li><a href="/universities/${esc(u.slug)}/">${esc(u.name)}</a> — ${esc(meta)}</li>`;
        })
        .join("");
    return (
        WRAP_OPEN +
        `<h1 style="font-size:1.75rem;font-weight:800;letter-spacing:-0.02em">${esc(PAGE_H1[route.path])}</h1>` +
        `<p>${esc(route.description)}</p>` +
        `<h2>Всички висши училища</h2>` +
        `<ul>${items}</ul>` +
        `<nav aria-label="Основни секции">${navLinks("/universities/")}</nav>` +
        `</div>`
    );
}

// Per-университет страница — огледало на UniversityPage.jsx.
function buildUniversityBody(route) {
    const { name, slug, faculties, cities, totalSpecialties, primaryCity } = route.uni;
    const facCount = faculties.length;

    const statBits = [
        primaryCity && (cities.length > 1 ? `${primaryCity} и още ${cities.length - 1} града` : primaryCity),
        `${facCount} ${plural(facCount, "факултет", "факултета")}`,
        `${totalSpecialties} ${plural(totalSpecialties, "специалност", "специалности")}`,
    ].filter(Boolean).join(" · ");

    // Трите абзаца — дословно същият текст като секцията в UniversityPage.jsx.
    const intro =
        `<section>` +
        `<h2>За приема в ${esc(name)} през ${ADMISSION_YEAR_SHORT} г.</h2>` +
        `<p>${esc(name)} е сред ${UNIVERSITIES} висши училища с публикувани условия за прием ` +
        `в УниПът. През академичната ${ADMISSION_YEAR_SHORT} г. приема кандидати за ${totalSpecialties} ` +
        `${plural(totalSpecialties, "специалност", "специалности")}, разпределени в ` +
        `${facCount} ${plural(facCount, "факултет", "факултета")}. Балообразуването следва ` +
        `коефициентите от официалния правилник за прием на висшето училище.</p>` +
        `<p>Изчисли реалния си конкурсен бал с <a href="/calculator/">калкулатора за бал</a> ` +
        `— той прилага точните формули за всяка от ${totalSpecialties} ` +
        `${plural(totalSpecialties, "специалност", "специалности")}, а където имаме официални ` +
        `данни от минали години — показва и историческия минимален бал за прием.</p>` +
        `<p>Не си сигурен/а в специалността? Започни с ` +
        `<a href="/career-advisor/">RIASEC кариерния тест</a> — той сравнява профила ти ` +
        `с ${RIASEC_SPECIALTIES} специалности и предлага най-подходящите.</p>` +
        `</section>`;

    // Факултети + специалности, всяка с deep link към калкулатора (същия href
    // както React-ът) — това е уникалното съдържание, което разчупва template
    // thinness и дава на Google 100+ вътрешни връзки към /calculator.
    const facSections = faculties.map((fac) => {
        const lis = fac.specs.map((sp) => {
            const href = `/calculator/?specialty=${encodeURIComponent(sp)}&university=${encodeURIComponent(name)}`;
            return `<li><a href="${esc(href)}">${esc(sp)}</a></li>`;
        }).join("");
        return (
            `<section>` +
            `<h2>${esc(fac.name)}</h2>` +
            `<p>${fac.specs.length} ${plural(fac.specs.length, "специалност", "специалности")}</p>` +
            `<ul>${lis}</ul>` +
            `</section>`
        );
    }).join("");

    // Връзки към други университети в същия град — cross-linking между
    // per-uni страниците (иначе всяка е listva само от хъба).
    const siblings = (route.uni.siblings || [])
        .map((s) => `<a href="/universities/${esc(s.slug)}/">${esc(s.name)}</a>`)
        .join(" · ");
    const siblingBlock = siblings
        ? `<nav aria-label="Университети в ${esc(primaryCity)}"><h2>Други университети в ${esc(primaryCity)}</h2>${siblings}</nav>`
        : "";

    return (
        WRAP_OPEN +
        `<p><a href="/universities/">Всички университети</a></p>` +
        `<h1 style="font-size:1.75rem;font-weight:800;letter-spacing:-0.02em">Прием в ${esc(name)} 2026</h1>` +
        `<p>${esc(statBits)}</p>` +
        `<p>Данни от наредбите на МОН, актуализирани за 2026 г.</p>` +
        intro +
        facSections +
        siblingBlock +
        `<nav aria-label="Основни секции">${navLinks(`/universities/${slug}/`)}</nav>` +
        `</div>`
    );
}

function buildBody(route, uniIndex) {
    if (route.uni) return buildUniversityBody(route);
    if (route.path === "/universities" && uniIndex.length) {
        return buildUniversitiesIndexBody(route, uniIndex);
    }
    const h1 = PAGE_H1[route.path] || route.title;
    const selfHref = route.path === "/" ? "/" : route.path.replace(/\/$/, "") + "/";
    return (
        WRAP_OPEN +
        `<h1 style="font-size:1.75rem;font-weight:800;letter-spacing:-0.02em">${esc(h1)}</h1>` +
        `<p>${esc(route.description)}</p>` +
        `<nav aria-label="Основни секции">${navLinks(selfHref)}</nav>` +
        `</div>`
    );
}

// Вмъква съдържанието в #root на shell-а, като ЗАМЕСТВА текущото му съдържание.
//
// Защо не просто `.replace('<div id="root"></div>', …)`: dist/index.html е
// едновременно shell И изход за route "/" — след първото писане #root вече не е
// празен и наивният replace тихо не прави нищо (всяка страница получаваше
// съдържанието на началната). Затова намираме затварящия таг чрез броене на
// вложеността и презаписваме вътрешността → скриптът е идемпотентен.
function injectBody(html, body) {
    const openTag = '<div id="root">';
    const start = html.indexOf(openTag);
    if (start === -1) {
        // Fallback за self-closing/празен вариант с атрибути в друг ред.
        return html.replace(/<div id="root"[^>]*><\/div>/, `<div id="root">${body}</div>`);
    }
    const contentStart = start + openTag.length;
    let depth = 1;
    let i = contentStart;
    const tag = /<(\/?)div\b/gi;
    tag.lastIndex = contentStart;
    let m;
    while ((m = tag.exec(html)) !== null) {
        depth += m[1] === "/" ? -1 : 1;
        if (depth === 0) { i = m.index; break; }
    }
    if (depth !== 0) throw new Error('Не намерих затварящия </div> на #root в shell-а.');
    return html.slice(0, contentStart) + body + html.slice(i);
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
            .select("university_name, faculty, city, specialty")
            .range(from, from + PAGE - 1);
        if (error) {
            console.warn(`⚠ Supabase грешка — пропускам per-uni: ${error.message}`);
            return [];
        }
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < PAGE) break;
    }

    // Групиране по университет → факултети със специалностите им, primary city.
    // Огледало на useMemo-то в UniversityPage.jsx (същото групиране и сортиране),
    // за да съвпадат числата и редът в prerender-а и в rendered страницата.
    const byUni = new Map();
    for (const row of allRows) {
        const name = row.university_name;
        if (!name) continue;
        if (!byUni.has(name)) byUni.set(name, { faculties: new Map(), specialties: new Set(), cities: new Map() });
        const u = byUni.get(name);
        const fac = row.faculty || "Общи специалности";
        if (!u.faculties.has(fac)) u.faculties.set(fac, []);
        u.faculties.get(fac).push(row.specialty || "");
        // Set, не брояч: университет с филиали има един и същ ред за всеки град
        // (НХА го предлага в София и Бургас). Броенето на редове показваше 22
        // специалности там, където реално са 17.
        if (row.specialty) u.specialties.add(row.specialty);
        if (row.city) u.cities.set(row.city, (u.cities.get(row.city) || 0) + 1);
    }

    const routes = [];
    for (const [name, u] of byUni) {
        const slug = slugify(name);
        if (!slug) continue;
        const faculties = [...u.faculties.entries()]
            .map(([facName, specs]) => ({
                name: facName,
                specs: specs.filter(Boolean).sort((a, b) => a.localeCompare(b, "bg")),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "bg"));
        const facCount = faculties.length;
        const total = u.specialties.size;
        const cities = [...u.cities.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
        const primaryCity = cities[0] || "";
        // Шаблоните трябва да съвпадат с UniversityPage.jsx seoTitle / seoDesc.
        const title = `${name} — прием и балообразуване 2026`;
        const description = `${name} — балообразуване ${ADMISSION_YEAR_SHORT}: точните коефициенти за ${total} специалности в ${facCount} факултета. Изчисли приемния си бал безплатно.`;

        // Schema.org — идентично на uniSchema / breadcrumbSchema в UniversityPage.jsx.
        const schemas = [
            {
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                name,
                url: `${SITE_URL}/universities/${slug}`,
                ...(primaryCity && {
                    address: { "@type": "PostalAddress", addressLocality: primaryCity, addressCountry: "BG" },
                }),
                areaServed: { "@type": "Country", name: "България" },
                department: faculties.map((f) => ({ "@type": "EducationalOrganization", name: f.name })),
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Начало", item: `${SITE_URL}/` },
                    { "@type": "ListItem", position: 2, name: "Университети", item: `${SITE_URL}/universities` },
                    { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/universities/${slug}` },
                ],
            },
        ];

        routes.push({
            path: `/universities/${slug}`,
            title,
            description,
            image: DEFAULT_IMAGE,
            schemas,
            uni: { name, slug, faculties, cities, primaryCity, totalSpecialties: total },
        });
    }

    // Cross-linking: до 6 други университета в същия град на всяка per-uni страница.
    for (const route of routes) {
        const { primaryCity, slug } = route.uni;
        if (!primaryCity) continue;
        route.uni.siblings = routes
            .filter((r) => r.uni.primaryCity === primaryCity && r.uni.slug !== slug)
            .slice(0, 6)
            .map((r) => ({ name: r.uni.name, slug: r.uni.slug }));
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
    // Индекс за хъб страницата /universities/ — сортиран по име, както в UI-я.
    let uniIndex = [];
    if (INCLUDE_DYNAMIC) {
        console.log("📡 Дърпам per-uni метаданни от Supabase…");
        const uniRoutes = await fetchUniversityRoutes();
        routes.push(...uniRoutes);
        uniIndex = uniRoutes
            .map((r) => r.uni)
            .sort((a, b) => a.name.localeCompare(b.name, "bg"));
        console.log(`   + ${uniRoutes.length} per-uni routes`);
    } else {
        console.log("ℹ Per-uni prerender изключен (SITEMAP_DYNAMIC≠1).");
    }

    let written = 0;
    let words = 0;
    for (const route of routes) {
        // "/" вече е dist/index.html — презаписваме го с правилния head също.
        const outDir = route.path === "/" ? DIST : resolve(DIST, `.${route.path}`);
        await mkdir(outDir, { recursive: true });
        const body = buildBody(route, uniIndex);
        let html = injectHead(shell, buildHead(route));
        html = injectBody(html, body);
        await writeFile(resolve(outDir, "index.html"), html, "utf8");
        written++;
        words += body.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    }

    console.log(`✅ Prerendered ${written} routes → dist/[route]/index.html`);
    console.log(`   ~${Math.round(words / written)} думи среден prerender-нат текст на страница`);
}

main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
});
