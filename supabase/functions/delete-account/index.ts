// Edge Function: delete-account
// ─────────────────────────────────────────────────────────────────────────────
// Реално изтриване на акаунта — CLAUDE.md §9 "trust-killing patterns" / GDPR:
// Profile.jsx досега само разлогваше потребителя и наричаше това "Изтрий
// завинаги", без да трие нищо от auth.users. Лъжа пред непълнолетна аудитория.
//
// POST (без тяло), Authorization: Bearer <потребителски access token>.
// Потвърждението по имейл вече е направено в UI-я (Profile.jsx); тук само
// проверяваме, че токенът принадлежи на реален, все още валиден потребител.
//
// Стъпки:
//   1. Проверява токена през anon клиент → взима user.id.
//   2. Изчиства reports.user_id (FK е RESTRICT, не CASCADE — иначе delete
//      пада, ако потребителят е подал доклад за грешка в калкулатора).
//   3. supabase.auth.admin.deleteUser(user.id) — истинско изтриване от
//      auth.users. identities/sessions/mfa се трият каскадно от Supabase.
//      reminder_subscriptions.user_id → NULL (FK SET NULL), редът остава,
//      защото имейл абонаментът не е обвързан с акаунта.
//
// admin_audit_log.admin_id е NOT NULL + RESTRICT: акаунт с админ действия
// не може да се изтрие по този път (очаквано — това е администраторски акаунт).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthorized" }, 401);

    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await asUser.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    // Иначе delete пада с FK violation, ако потребителят е подал доклад.
    await admin.from("reports").update({ user_id: null }).eq("user_id", user.id);

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
        console.error("[delete-account] deleteUser failed", user.id, delErr.message);
        const adminBlocked = /admin_audit_log|foreign key/i.test(delErr.message);
        return json({
            error: adminBlocked ? "admin_account" : "delete_failed",
            message: adminBlocked
                ? "Този акаунт е администраторски и не може да се изтрие оттук."
                : "Изтриването не мина. Опитай пак или пиши ни.",
        }, 500);
    }

    return json({ ok: true });
});
