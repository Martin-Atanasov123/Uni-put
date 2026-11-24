// Edge Function: contact-notify
// ─────────────────────────────────────────────────────────────────────────────
// Препраща ново съобщение от формата „Пиши ни“ (public.contact_messages) на
// CONTACT_TO (по подразбиране uniput1000@gmail.com) през Resend.
//
// Сайтът извиква POST { id } веднага след insert. Функцията сама чете реда със
// service role — затова през нея не може да се прати произволен текст: само
// съобщение, което вече е в базата, още не е препратено (notified_at IS NULL)
// и е от последните 15 минути. После записва notified_at, за да не се прати два пъти.
//
// Без RESEND_API_KEY е дормантна: връща { ok: false, emailPending: true },
// съобщението си остава в админ панела.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const CONTACT_TO = Deno.env.get("CONTACT_TO") ?? "uniput1000@gmail.com";
const MAIL_FROM = Deno.env.get("CONTACT_FROM") ?? "УниПът <contact@mail.uniput.eu>";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ ok: false }, 405);

    let id = "";
    try { id = String((await req.json())?.id ?? ""); } catch { /* празно тяло */ }
    if (!UUID_RE.test(id)) return json({ ok: false, error: "bad id" }, 400);

    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: row, error } = await admin
        .from("contact_messages")
        .select("id, created_at, name, email, message")
        .eq("id", id)
        .is("notified_at", null)
        .gte("created_at", since)
        .maybeSingle();
    if (error) { console.error("select", error.message); return json({ ok: false }, 500); }
    if (!row) return json({ ok: false, error: "not found" }, 404);

    if (!RESEND_API_KEY) return json({ ok: false, emailPending: true });

    // Заключваме реда преди изпращането — паралелно второ извикване няма да мине.
    const { data: locked } = await admin
        .from("contact_messages")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", id)
        .is("notified_at", null)
        .select("id");
    if (!locked?.length) return json({ ok: true, duplicate: true });

    const who = row.name ? `${row.name} <${row.email}>` : row.email;
    const when = new Date(row.created_at).toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });
    const subject = `Ново съобщение от сайта — ${row.name || row.email}`.slice(0, 140);
    const text = `От: ${who}\nКога: ${when}\n\n${row.message}\n\n— Отговори директно на този имейл. Всички съобщения: https://uniput.eu/admin/reports`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#152B29">
<p style="margin:0 0 4px"><b>От:</b> ${esc(who)}</p>
<p style="margin:0 0 16px;color:#5b6b68"><b>Кога:</b> ${esc(when)}</p>
<div style="padding:16px;border:1px solid #d9e2df;border-radius:12px;white-space:pre-wrap">${esc(row.message)}</div>
<p style="margin:16px 0 0;color:#5b6b68;font-size:13px">Отговори директно на този имейл. Всички съобщения: <a href="https://uniput.eu/admin/reports">админ панела</a>.</p>
</div>`;

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: MAIL_FROM, to: CONTACT_TO, reply_to: row.email, subject, text, html }),
    });
    if (!res.ok) {
        console.error("resend error", res.status, await res.text());
        // Връщаме реда, за да може да се опита пак.
        await admin.from("contact_messages").update({ notified_at: null }).eq("id", id);
        return json({ ok: false }, 502);
    }
    return json({ ok: true });
});
