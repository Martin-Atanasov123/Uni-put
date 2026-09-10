// Edge Function: deadline-reminders
// ─────────────────────────────────────────────────────────────────────────────
// Единствената retention механика за 12. клас (CLAUDE.md §12/§18): имейл
// напомняне 7 и 1 дни преди края на срока за кандидатстване в даден университет.
//
// Две действия:
//   POST { action: "subscribe", email, university_name?, user_id? }
//        → записва (service role, bypass RLS) + праща confirm имейл (double opt-in).
//   POST { action: "send" }  (извиква се от pg_cron дневно; иска x-cron-key ако е зададен CRON_SECRET)
//        → (1) праща confirm имейли на непотвърдените отпреди < 30 дни
//          (2) праща напомняния на потвърдените за срокове до 7 / 1 дни
//
// ДОРМАНТНО без RESEND_API_KEY: записва редовете, но не праща имейли и връща
// { emailPending: true }. Активира се само с добавяне на секрета — нула промени
// по кода. За да заработи:
//   1. Направи безплатен акаунт в Resend (resend.com), верифицирай домейн uniput.eu
//   2. supabase secrets set RESEND_API_KEY=re_xxx  (и по избор CRON_SECRET, SITE_URL, MAIL_FROM)
//   3. Приложи migrations/20260911000100_reminder_cron.sql (планира дневния cron)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://uniput.eu").replace(/\/+$/, "");
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "УниПът <напомняния@uniput.eu>";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// ── Изпращане през Resend (no-op без ключ) ──────────────────────────────────
async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    if (!RESEND_API_KEY) return false;
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: MAIL_FROM, to, subject, text }),
    });
    if (!res.ok) {
        console.error("resend error", res.status, await res.text());
        return false;
    }
    return true;
}

function confirmEmailBody(token: string, uni: string | null): string {
    const link = `${SITE_URL}/reminders/confirm?token=${token}`;
    const scope = uni ? `за срокове в „${uni}"` : "за всички срокове за кандидатстване";
    return [
        "Здравей,",
        "",
        `Заяви напомняния по имейл ${scope} от УниПът.`,
        "Потвърди, за да ги активираш:",
        "",
        link,
        "",
        "Ако не си ти — просто игнорирай този имейл, няма да получиш нищо повече.",
        "",
        "— УниПът · uniput.eu",
    ].join("\n");
}

function reminderEmailBody(
    uni: string, title: string, dateStr: string, daysLeft: number, sourceUrl: string | null, unsubToken: string,
): string {
    const unsub = `${SITE_URL}/reminders/unsubscribe?token=${unsubToken}`;
    const when = daysLeft <= 1 ? "утре" : `след ${daysLeft} дни`;
    return [
        `⏰ Срокът „${title}" в ${uni} изтича ${when} — ${dateStr}.`,
        "",
        "Провери какво още ти трябва и не изпускай класирането.",
        sourceUrl ? `Официален източник: ${sourceUrl}` : "",
        `Твоят бал и шансове: ${SITE_URL}/calculator/`,
        "",
        "———",
        `Спри напомнянията: ${unsub}`,
        "— УниПът · uniput.eu",
    ].filter(Boolean).join("\n");
}

const MONTHS = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
function fmtDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]} ${y} г.`;
}
function daysUntil(iso: string): number {
    const [y, m, d] = iso.split("-").map(Number);
    const target = Date.UTC(y, m - 1, d);
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((target - today) / 86_400_000);
}

// ── action: subscribe ──────────────────────────────────────────────────────
async function handleSubscribe(body: Record<string, unknown>) {
    const email = String(body.email ?? "").trim().toLowerCase();
    const universityName = body.university_name ? String(body.university_name).slice(0, 200) : null;
    const userId = body.user_id ? String(body.user_id) : null;

    if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: "invalid_email" }, 400);

    // Съществуващо активно/отписано записване за тази двойка (имейл × университет)?
    let q = admin.from("reminder_subscriptions")
        .select("id, confirmed_at, confirm_token, unsubscribed_at, confirm_sent_at")
        .eq("email", email);
    q = universityName === null ? q.is("university_name", null) : q.eq("university_name", universityName);
    const { data: existing } = await q.maybeSingle();

    let row = existing;
    if (row && row.unsubscribed_at) {
        const { data } = await admin.from("reminder_subscriptions")
            .update({ unsubscribed_at: null, confirmed_at: null, confirm_token: crypto.randomUUID(), notified_event_ids: [] })
            .eq("id", row.id).select("id, confirmed_at, confirm_token").single();
        row = data;
    } else if (!row) {
        const { data, error } = await admin.from("reminder_subscriptions")
            .insert({ email, university_name: universityName, user_id: userId })
            .select("id, confirmed_at, confirm_token").single();
        if (error) {
            if (error.code === "23505") return json({ ok: true, alreadySubscribed: true });
            console.error("insert error", error);
            return json({ error: "db_error" }, 500);
        }
        row = data;
    }

    if (row?.confirmed_at) return json({ ok: true, alreadyConfirmed: true });

    let emailed = false;
    if (RESEND_API_KEY && row) {
        emailed = await sendEmail(email, "Потвърди напомнянията от УниПът", confirmEmailBody(row.confirm_token, universityName));
        if (emailed) {
            await admin.from("reminder_subscriptions").update({ confirm_sent_at: new Date().toISOString() }).eq("id", row.id);
        }
    }
    return json({ ok: true, emailPending: !emailed });
}

// ── action: send (cron) ────────────────────────────────────────────────────
async function handleSend() {
    let confirmSent = 0, remindersSent = 0;

    // (1) confirm имейли за непотвърдени (< 30 дни, не пращани в последните 3 дни)
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const resendCut = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const { data: pending } = await admin
        .from("reminder_subscriptions")
        .select("id, email, university_name, confirm_token, confirm_sent_at")
        .is("confirmed_at", null)
        .is("unsubscribed_at", null)
        .gte("created_at", cutoff)
        .limit(200);
    for (const s of pending ?? []) {
        if (s.confirm_sent_at && s.confirm_sent_at > resendCut) continue;
        if (await sendEmail(s.email, "Потвърди напомнянията от УниПът", confirmEmailBody(s.confirm_token, s.university_name))) {
            await admin.from("reminder_subscriptions").update({ confirm_sent_at: new Date().toISOString() }).eq("id", s.id);
            confirmSent++;
        }
    }

    // (2) напомняния за срокове до 7 / 1 дни
    const { data: events } = await admin
        .from("admission_events")
        .select("id, university_name, event_type, title, start_date, end_date, source_url")
        .in("event_type", ["application", "exam"])
        .eq("is_confirmed", true);
    const dueEvents = (events ?? [])
        .map((e) => ({ ...e, deadline: e.end_date ?? e.start_date }))
        .map((e) => ({ ...e, days: daysUntil(e.deadline) }))
        .filter((e) => e.days === 7 || e.days === 1);
    if (dueEvents.length === 0) return json({ ok: true, confirmSent, remindersSent });

    const { data: subs } = await admin
        .from("reminder_subscriptions")
        .select("id, email, university_name, unsubscribe_token, notified_event_ids")
        .not("confirmed_at", "is", null)
        .is("unsubscribed_at", null)
        .limit(5000);
    for (const s of subs ?? []) {
        const notified = new Set<string>(s.notified_event_ids ?? []);
        const before = notified.size;
        for (const e of dueEvents) {
            if (notified.has(e.id)) continue;
            if (s.university_name && s.university_name !== e.university_name) continue;
            const ok = await sendEmail(
                s.email,
                `⏰ ${e.days <= 1 ? "Утре" : `След ${e.days} дни`}: ${e.title} — ${e.university_name}`,
                reminderEmailBody(e.university_name, e.title, fmtDate(e.deadline), e.days, e.source_url, s.unsubscribe_token),
            );
            if (ok) {
                notified.add(e.id);
                remindersSent++;
            }
        }
        if (notified.size !== before) {
            await admin.from("reminder_subscriptions")
                .update({ notified_event_ids: [...notified], last_notified_at: new Date().toISOString() })
                .eq("id", s.id);
        }
    }
    return json({ ok: true, confirmSent, remindersSent, dueEvents: dueEvents.length });
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

    const action = String(body.action ?? "");
    if (action === "subscribe") return handleSubscribe(body);
    if (action === "send") {
        if (CRON_SECRET && req.headers.get("x-cron-key") !== CRON_SECRET) return json({ error: "forbidden" }, 403);
        return handleSend();
    }
    return json({ error: "unknown_action" }, 400);
});
