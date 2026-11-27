// Снима OG картинките от scripts/og/og-cards.html → public/og/v2/<id>.png (1200×630).
//
//   node scripts/og/render-og.mjs
//
// Ползва Playwright (вече е в devDependencies за E2E тестовете) и вграден статичен
// сървър, за да зареди Inter от node_modules и логото от public/.
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "og", "v2");
const TYPES = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

const server = createServer(async (req, res) => {
    const path = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
        const body = await readFile(path);
        res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" }).end(body);
    } catch {
        res.writeHead(404).end();
    }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const { port } = server.address();

await mkdir(OUT, { recursive: true });
// Chromium на Playwright (npx playwright install), иначе инсталираният Google Chrome.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: "chrome" }));
const page = await browser.newPage({ viewport: { width: 1240, height: 700 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/scripts/og/og-cards.html`);
await page.evaluate(() => document.fonts.ready);
const ids = await page.$$eval("section", (s) => s.map((x) => x.id));
for (const id of ids) {
    await page.locator(`#${id}`).screenshot({ path: join(OUT, `${id}.png`) });
    console.log(`✓ public/og/v2/${id}.png`);
}
await browser.close();
server.close();
