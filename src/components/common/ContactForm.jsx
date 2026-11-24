import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// Форма „Пиши ни“ — записва в public.contact_messages (RLS: всеки може да пише,
// само админ чете) и вика contact-notify, който го праща на uniput1000@gmail.com. Без .select() след insert: анонимният няма право да чете.
// Полето „website“ е капан за ботове — човек не го вижда и не го попълва.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function ContactForm() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState(user?.email || "");
    const [message, setMessage] = useState("");
    const [trap, setTrap] = useState("");
    const [errors, setErrors] = useState({});
    const [state, setState] = useState("idle"); // idle | sending | sent | failed

    const validate = () => {
        const e = {};
        if (!EMAIL_RE.test(email.trim())) e.email = "Въведи имейл, на който да ти отговорим.";
        if (message.trim().length < 10) e.message = "Напиши поне няколко думи — минимум 10 символа.";
        return e;
    };

    const onSubmit = async (ev) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        if (trap) { setState("sent"); return; }
        setState("sending");
        // id се създава тук: анонимният не може да прочете реда обратно, а функцията
        // contact-notify го препраща по имейл само по id.
        const id = crypto.randomUUID();
        const { error } = await supabase.from("contact_messages").insert({
            id,
            name: name.trim().slice(0, 80) || null,
            email: email.trim().slice(0, 200),
            message: message.trim().slice(0, 2000),
            user_id: user?.id ?? null,
        });
        if (!error) {
            // Имейлът е допълнение — ако не мине, съобщението пак е в админ панела.
            supabase.functions.invoke("contact-notify", { body: { id } }).catch(() => {});
        }
        setState(error ? "failed" : "sent");
    };

    if (state === "sent") {
        return (
            <div className="cf cf--sent" role="status">
                <CheckCircle2 size={24} strokeWidth={1.75} aria-hidden="true" />
                <div>
                    <p className="cf__ok-title">Съобщението е изпратено</p>
                    <p className="cf__ok-text">Ще ти отговорим на {email.trim()}, обикновено до 2 работни дни.</p>
                    <button type="button" className="cf__again" onClick={() => { setMessage(""); setState("idle"); }}>
                        Изпрати ново съобщение
                    </button>
                </div>
                <style>{CSS}</style>
            </div>
        );
    }

    return (
        <form className="cf" onSubmit={onSubmit} noValidate aria-labelledby="cf-title">
            <style>{CSS}</style>
            <p id="cf-title" className="cf__title">Пиши ни</p>
            <div className="cf__row">
                <label className="cf__field">
                    <span>Име <small>(по желание)</small></span>
                    <input type="text" name="name" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="cf__field">
                    <span>Имейл</span>
                    <input
                        type="email" name="email" autoComplete="email" maxLength={200} required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={!!errors.email} aria-describedby={errors.email ? "cf-email-err" : undefined}
                    />
                    {errors.email && <em id="cf-email-err" className="cf__err">{errors.email}</em>}
                </label>
            </div>
            <label className="cf__field">
                <span>Съобщение</span>
                <textarea
                    name="message" rows={4} maxLength={2000} required
                    placeholder="Липсва специалност, видя грешка или имаш въпрос"
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    aria-invalid={!!errors.message} aria-describedby={errors.message ? "cf-msg-err" : undefined}
                />
                {errors.message && <em id="cf-msg-err" className="cf__err">{errors.message}</em>}
            </label>
            <label className="cf__trap" aria-hidden="true">
                Сайт <input type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </label>
            {state === "failed" && <p className="cf__err" role="alert">Не успяхме да изпратим съобщението. Провери връзката и опитай пак.</p>}
            <div className="cf__foot">
                <button type="submit" className="cf__send" disabled={state === "sending"}>
                    {state === "sending"
                        ? <><Loader2 size={18} className="cf__spin" aria-hidden="true" /> Изпращане…</>
                        : <>Изпрати съобщението <Send size={16} strokeWidth={1.75} aria-hidden="true" /></>}
                </button>
                <small>Използваме имейла само за да ти отговорим.</small>
            </div>
        </form>
    );
}

const CSS = `
.cf { margin-top: 20px; padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-feature); background: var(--surface); display: grid; gap: 14px; }
@media (min-width: 768px) { .cf { padding: 24px; } }
.cf__title { margin: 0; font-size: 17px; font-weight: 700; color: var(--ink); }
.cf__row { display: grid; gap: 14px; }
@media (min-width: 600px) { .cf__row { grid-template-columns: 1fr 1fr; } }
.cf__field { display: grid; gap: 6px; min-width: 0; }
.cf__field > span { font-size: 14px; font-weight: 650; color: var(--ink); }
.cf__field small { font-weight: 500; color: var(--ink-muted); }
.cf__field input, .cf__field textarea { width: 100%; box-sizing: border-box; min-height: 48px; padding: 12px 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--canvas); color: var(--ink); font: inherit; font-size: 16px; outline: none; transition: border-color 0.14s ease, box-shadow 0.14s ease; }
.cf__field textarea { resize: vertical; min-height: 112px; line-height: 1.5; }
.cf__field input:focus, .cf__field textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
.cf__field [aria-invalid="true"] { border-color: var(--danger); }
.cf__field textarea::placeholder { color: var(--ink-muted); opacity: 1; }
.cf__err { margin: 0; font-style: normal; font-size: 14px; color: var(--danger); }
.cf__trap { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.cf__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; }
.cf__foot small { font-size: 13px; color: var(--ink-muted); }
.cf__send { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 22px; border: 0; border-radius: var(--radius-control); background: var(--brand); color: var(--on-brand); font: inherit; font-weight: 700; cursor: pointer; transition: background-color 0.14s ease, transform 0.14s ease; }
.cf__send:hover:not(:disabled) { background: var(--brand-hover); transform: translateY(-1px); }
.cf__send:active:not(:disabled) { transform: translateY(0); }
.cf__send:disabled { opacity: 0.7; cursor: wait; }
.cf__send:focus-visible, .cf__again:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (max-width: 599px) { .cf__send { width: 100%; } }
.cf__spin { animation: cf-spin 0.9s linear infinite; }
@keyframes cf-spin { to { transform: rotate(360deg); } }
.cf--sent { grid-template-columns: auto 1fr; align-items: start; gap: 12px; color: var(--success); }
.cf__ok-title { margin: 0; font-size: 17px; font-weight: 700; color: var(--ink); }
.cf__ok-text { margin: 4px 0 0; font-size: 15px; line-height: 1.5; color: var(--ink-muted); }
.cf__again { margin-top: 8px; min-height: 44px; padding: 0; border: 0; background: none; color: var(--brand); font: inherit; font-weight: 650; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
@media (prefers-reduced-motion: reduce) { .cf__spin { animation: none; } .cf__send { transition: none; } .cf__send:hover:not(:disabled) { transform: none; } }
`;
