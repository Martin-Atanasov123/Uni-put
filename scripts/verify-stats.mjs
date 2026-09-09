// Пазач срещу разминаване между публичните твърдения и реалните данни.
//
// ЗАЩО: числата "51 университета", "845 специалности", "68 общежития в 16 града"
// бяха написани на ръка на 12 места. Базата междувременно казваше 50 / 852 / 9.
// За образователен продукт едно такова разминаване подкопава доверието в
// целите данни — ученикът се пита "щом бройката е грешна, верни ли са
// коефициентите?". src/lib/siteStats.js е единственият източник; този скрипт
// проверява дали още отговаря на базата.
//
//   node scripts/verify-stats.mjs         → отчита разминаванията (exit 1)
//   node scripts/verify-stats.mjs --fix   → презаписва siteStats.js с реалните
//
// Не е в build pipeline-а нарочно: билдът не бива да пада, защото си вкарал
// нов университет. Пусни го след всяко масово вкарване на данни.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import * as CLAIMED from "../src/lib/siteStats.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const STATS_FILE = resolve(ROOT, "src/lib/siteStats.js");
const FIX = process.argv.includes("--fix");

async function loadDotEnvIfPresent(envPath) {
    if (!existsSync(envPath)) return;
    for (const line of (await readFile(envPath, "utf8")).split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m || process.env[m[1]]) continue;
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
}

// PostgREST капва на ~1000 реда per request независимо от .limit() — пагинираме,
// иначе бройките мълчаливо се отрязват (същият капан като в sitemap скрипта).
async function fetchAll(supabase, table, columns) {
    const PAGE = 1000;
    const rows = [];
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
            .from(table).select(columns).range(from, from + PAGE - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...data);
        if (data.length < PAGE) break;
    }
    return rows;
}

const uniq = (rows, fn) => new Set(rows.map(fn).filter(Boolean)).size;

async function main() {
    await loadDotEnvIfPresent(resolve(ROOT, ".env"));
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Липсват VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");

    const supabase = createClient(url, key, {
        auth: { persistSession: false },
        realtime: { transport: WebSocket },
    });

    const unis = await fetchAll(supabase, "universities", "university_name,specialty,city");
    const riasec = await fetchAll(supabase, "specialty_riasec_mapping", "specialty_base_name");
    const careers = await fetchAll(supabase, "careers_riasec_mapping", "id");
    const dorms = await fetchAll(supabase, "dormitories", "id,city");

    const actual = {
        UNIVERSITIES: uniq(unis, r => r.university_name),
        SPECIALTIES: uniq(unis, r => r.specialty),
        PROGRAMS: uniq(unis, r => `${r.university_name}|${r.specialty}`),
        UNIVERSITY_CITIES: uniq(unis, r => r.city),
        RIASEC_SPECIALTIES: uniq(riasec, r => r.specialty_base_name),
        CAREERS: careers.length,
        DORMITORIES: dorms.length,
        DORMITORY_CITIES: uniq(dorms, r => r.city),
    };

    const drift = Object.entries(actual)
        .filter(([k, v]) => CLAIMED[k] !== v)
        .map(([k, v]) => ({ key: k, claimed: CLAIMED[k], actual: v }));

    for (const [k, v] of Object.entries(actual)) {
        const mark = CLAIMED[k] === v ? "✅" : "⚠️ ";
        const note = CLAIMED[k] === v ? "" : `  (сайтът твърди ${CLAIMED[k]})`;
        console.log(`${mark} ${k.padEnd(20)} ${String(v).padStart(5)}${note}`);
    }

    if (!drift.length) {
        console.log("\n✅ siteStats.js отговаря на базата.");
        return;
    }

    if (!FIX) {
        console.log(`\n⚠️  ${drift.length} разминаване(ия). Пусни с --fix, за да ги обновиш.`);
        process.exitCode = 1;
        return;
    }

    let src = await readFile(STATS_FILE, "utf8");
    for (const { key, actual: v } of drift) {
        const re = new RegExp(`(export const ${key} = )\d+(;)`);
        if (!re.test(src)) throw new Error(`Не намирам "export const ${key}" в siteStats.js`);
        src = src.replace(re, `$1${v}$2`);
    }
    const today = new Date().toISOString().slice(0, 10);
    src = src.replace(/(Последна проверка спрямо Supabase: )\d{4}-\d{2}-\d{2}/, `$1${today}`);
    await writeFile(STATS_FILE, src, "utf8");
    console.log(`\n✅ Обновени ${drift.length} стойности в src/lib/siteStats.js.`);
    console.log("   Пусни `npm run generate:og`, ако числата се показват в OG изображенията.");
}

main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
});
