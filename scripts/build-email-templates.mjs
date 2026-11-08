// Генерира HTML шаблоните за имейлите на Supabase Auth от общия дизайн
// (supabase/functions/deadline-reminders/emailLayout.ts).
//
//   node scripts/build-email-templates.mjs
//
// Резултат: supabase/templates/<slug>.html + manifest.json (теми по шаблон) +
// supabase/templates/preview.html (всички шаблони на една страница за преглед).
// Шаблоните се поставят в Supabase → Authentication → Emails (slug-ът е в адреса
// на страницата). Променливите {{ .ConfirmationURL }}, {{ .Token }} и т.н. са Go
// шаблони на Supabase и остават непроменени в HTML-а.
//
// Изисква Node ≥ 22.18 (зарежда .ts чрез type stripping).
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { layout } from "../supabase/functions/deadline-reminders/emailLayout.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "supabase/templates");
// Копие, достъпно по https://uniput.eu/email/templates/<slug>.html — от там се зарежда в таблото на Supabase.
const PUBLIC_OUT = resolve(ROOT, "public/email/templates");

import { templates as templateData } from "./email-templates-data.mjs";

const templates = Object.fromEntries(
    Object.entries(templateData).map(([slug, d]) => [slug, { subject: d.subject, html: layout(d.options) }])
);

await mkdir(OUT, { recursive: true });
await mkdir(PUBLIC_OUT, { recursive: true });
const manifest = {};
for (const [slug, t] of Object.entries(templates)) {
    await writeFile(resolve(OUT, `${slug}.html`), t.html, "utf8");
    await writeFile(resolve(PUBLIC_OUT, `${slug}.html`), t.html, "utf8");
    manifest[slug] = { subject: t.subject };
}
await writeFile(resolve(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

// Преглед: подменяме Go променливите с примерни стойности.
const SAMPLE = {
    "{{ .ConfirmationURL }}": "https://uniput.eu/auth/confirm?token=пример",
    "{{ .Token }}": "482 913",
    "{{ .Email }}": "uchenik@example.com",
    "{{ .NewEmail }}": "novo.ime@example.com",
    "{{ .OldEmail }}": "staro.ime@example.com",
    "{{ .SiteURL }}": "https://uniput.eu",
    "{{ .Provider }}": "Google",
};
const fill = (html) => Object.entries(SAMPLE).reduce((h, [k, v]) => h.split(k).join(v), html);
const frames = Object.entries(templates)
    .map(([slug, t]) => `<h2 style="font:600 14px system-ui;margin:28px 0 8px;color:#333">${slug} — „${t.subject}“</h2><iframe style="width:100%;height:760px;border:1px solid #ccc;background:#fff" srcdoc="${fill(t.html).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe>`)
    .join("\n");
await writeFile(resolve(OUT, "preview.html"), `<!doctype html><meta charset="utf-8"><title>Преглед на имейлите</title><body style="font-family:system-ui;max-width:720px;margin:24px auto;padding:0 12px">${frames}</body>`, "utf8");

console.log(`Генерирани ${Object.keys(templates).length} шаблона в supabase/templates/`);
