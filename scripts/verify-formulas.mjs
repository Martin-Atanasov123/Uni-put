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

import { plovdivProgram, plovdivVariantScores } from "../src/lib/plovdivScore.js";
import { vfuProgram, vfuScore } from "../src/lib/vfuScore.js";
import { uardProgram, uardScore } from "../src/lib/uardScore.js";
import { tourismCollegeProgram, tourismCollegeScore } from "../src/lib/tourismCollegeScore.js";
import { nmaProgram, nmaScore } from "../src/lib/nmaScore.js";
import { hasNonNumericAdmissions } from "../src/lib/admissionSources.js";
import { nbuProgram, nbuScore, nbuFields } from "../src/lib/nbuScore.js";
import { assessFormula } from "../src/lib/formulaIntegrity.js";
import { ADMISSION_YEAR } from "../src/lib/siteStats.js";

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
        `${url}/rest/v1/universities?select=university_name,specialty,city,max_ball,coefficients&academic_year=eq.${encodeURIComponent(ADMISSION_YEAR)}&order=id&offset=${offset}&limit=1000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
}

const mismatches = rows.map(r => ({ ...r, ...assessFormula(r) })).filter(r => r.issue);

console.log(`Формули: ${rows.length} · съвпадат с max_ball: ${rows.length - mismatches.length} · разминавания: ${mismatches.length}`);
const pointScaleMatches = mismatches.filter(row => {
    const program = nbuProgram(row);
    if (!program?.weights) return false;
    const inputs = Object.fromEntries(Object.keys(program.weights).map(key => [key, nbuFields[key].max]));
    return nbuScore(program.weights, inputs).score === Number(row.max_ball);
});
const variantMatches = mismatches.filter(row => {
    const program = plovdivProgram(row);
    if (!program) return false;
    const grades = Object.fromEntries(Object.keys(program.fields).map(field => [field, 6]));
    return plovdivVariantScores(program, grades).every(score => score === Number(row.max_ball));
});
const officialVfuRules = mismatches.filter(row => vfuProgram(row) && vfuScore(6, 6, true) === 19);
const officialUardRules = mismatches.filter(row => uardProgram(row) && uardScore(6, 6, 6) === Number(row.max_ball));
const officialCollegeRules = mismatches.filter(row => tourismCollegeProgram(row) && tourismCollegeScore(6, 6, 6, 6) === Number(row.max_ball));
const officialNmaRules = mismatches.filter(row => nmaProgram(row) && nmaScore(6, true)?.score === Number(row.max_ball));
const nonNumericAdmissions = mismatches.filter(hasNonNumericAdmissions);
console.log(`От разминаванията: ${pointScaleMatches.length} програми с проверена точкова скала на НБУ; ${variantMatches.length} с отделни варианти на ПУ; ${officialVfuRules.length} със сверена формула на ВСУ (различна от max_ball в базата); ${officialUardRules.length} със сверена формула на ВУАРР; ${officialCollegeRules.length} с формула на Колежа по туризъм – Варна; ${officialNmaRules.length} с формула на НМА; ${nonNumericAdmissions.length} без публикувана единна числова формула (ВУМ/АУБ); ${mismatches.length - pointScaleMatches.length - variantMatches.length - officialVfuRules.length - officialUardRules.length - officialCollegeRules.length - officialNmaRules.length - nonNumericAdmissions.length} за ръчна проверка.`);
const byUni = {};
mismatches.forEach((m) => { byUni[m.university_name] = (byUni[m.university_name] || 0) + 1; });
for (const [uni, n] of Object.entries(byUni).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} × ${uni}`);
if (process.argv.includes("--list")) {
    mismatches.forEach((m) => console.log(`- ${m.university_name} | ${m.specialty} | max_ball ${m.max_ball} | 6.00 навсякъде → ${m.maximum ?? "—"} (${m.issue})`));
}
