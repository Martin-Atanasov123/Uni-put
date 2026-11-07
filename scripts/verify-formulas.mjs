// Проверка на целостността на формулите за балообразуване.
//
// Идея: ако във всеки слот на формулата въведем 6.00, калкулаторът трябва да даде
// точно max_ball на специалността. Разминаването е сигнал за грешка в коефициентите
// ИЛИ за университет с друга скала (напр. НБУ — точки до 1000), които се преглеждат ръчно.
//
//   node scripts/verify-formulas.mjs        → печата обобщение и разминаванията
//
// Само за четене; не променя базата и не е в build pipeline-а.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function loadDotEnvIfPresent(envPath) {
    if (!existsSync(envPath)) return;
    for (const line of (await readFile(envPath, "utf8")).split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m || process.env[m[1]]) continue;
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
}

await loadDotEnvIfPresent(resolve(ROOT, ".env"));
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Липсват VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");

// PostgREST връща най-много 1000 реда на заявка — пагинираме.
const rows = [];
for (let offset = 0; ; offset += 1000) {
    const res = await fetch(
        `${url}/rest/v1/universities?select=university_name,specialty,max_ball,coefficients&order=id&offset=${offset}&limit=1000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
}

const allSixes = (coefficients) =>
    (coefficients || []).reduce(
        (sum, slot) => sum + Math.max(...(slot.alternatives || []).map((a) => 6 * Number(a.coef))),
        0
    );

const mismatches = rows
    .map((r) => ({ ...r, calc: allSixes(r.coefficients), max: Number(r.max_ball) }))
    .filter((r) => Math.abs(r.calc - r.max) >= 0.01);

console.log(`Формули: ${rows.length} · съвпадат с max_ball: ${rows.length - mismatches.length} · разминавания: ${mismatches.length}`);
const byUni = {};
mismatches.forEach((m) => { byUni[m.university_name] = (byUni[m.university_name] || 0) + 1; });
for (const [uni, n] of Object.entries(byUni).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} × ${uni}`);
if (process.argv.includes("--list")) {
    mismatches.forEach((m) => console.log(`- ${m.university_name} | ${m.specialty} | max_ball ${m.max} | 6.00 навсякъде → ${m.calc}`));
}
