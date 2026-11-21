import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/common/Seo";
import JsonLd from "@/components/common/JsonLd";
import { UNIVERSITIES, ADMISSION_YEAR_SHORT } from "@/lib/siteStats";
import { HOME_HTML, HOME_CSS } from "./homePage";

// Schema.org structured data — описание на УниПът като организация и сайт.
const HOME_SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            name: "УниПът",
            url: "https://uniput.eu",
            logo: "https://uniput.eu/university.png",
            description: "Безплатна платформа за изчисляване на кандидатстудентски бал и кариерно ориентиране на български кандидат-студенти",
            areaServed: { "@type": "Country", name: "България" },
            knowsAbout: ["Балообразуване", "Кандидатстудентски бал", "RIASEC кариерен тест", "Висше образование в България"],
        },
        { "@type": "WebSite", url: "https://uniput.eu", name: "УниПът", inLanguage: "bg-BG" },
    ],
};

// ── Китът на taste-skill (public/taste) ─────────────────────────────────────
// Началната е самостоятелна страница по скила: неговите стилове и скриптове се зареждат само тук
// и се махат, когато потребителят отиде на друга страница, за да не пипат останалия сайт.
const KIT = "/taste/";
const KIT_CSS = ["system.css", "ui/cards.css", "ui/base.css", "motion/motion.css", "layout/layout.css", "icons/icon.css"];
const KIT_JS = ["system.js", "motion/motion.js", "layout/layout.js"];
const HTML_ATTRS = { "data-type": "software", "data-radius": "soft", "data-buttons": "arrow", "data-motion": "" };
const METAS = [["site-kind", "software"], ["page-type", "software"]];

// :root точно както го отпечата start.mjs (palette mint-pink-accounts, type onest)
const ROOT_TOKENS = `:root {
  --p-bg: #f8f8f8; --p-surface: #eeeeee; --p-ink: #0a0a0a; --p-muted: #6a6a6a;
  --p-accent: #1f6b3a; --p-accent-ink: #ffffff; --p-action: #1f6b3a; --p-action-ink: #ffffff;
  --p-inv-bg: #0a0a0a; --p-inv-surface: #171717; --p-inv-ink: #f8f8f8; --p-inv-muted: #939393;
  --p-inv-accent: #1f6b3a; --p-inv-accent-ink: #ffffff; --p-inv-action: #1f6b3a; --p-inv-action-ink: #ffffff;
  --font-display: "Onest", system-ui, sans-serif;
  --font-text: "Onest", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 400;
  --display-tracking: -0.035em;
  --display-tracking-xl: -0.04em;
}`;

let kitScriptsLoaded = false;

// Файловете в /public не минават през Vite: import() се строи по време на изпълнение, за да не го
// пренапише Vite (CSP-то вече позволява 'unsafe-eval').
const importKit = new Function("url", "return import(url)");

export default function Home() {
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);
    const hostRef = useRef(null);

    // Стилове, атрибути на <html> и мета таговете на кита — само докато сме на началната.
    useEffect(() => {
        const html = document.documentElement;
        const prev = {};
        for (const [k, v] of Object.entries(HTML_ATTRS)) { prev[k] = html.getAttribute(k); html.setAttribute(k, v); }
        const prevLang = html.getAttribute("lang");
        html.setAttribute("lang", "bg");
        html.classList.add("m-enter", "mo-js");
        const t1 = setTimeout(() => html.classList.add("m-enter-done"), 700);
        const t2 = setTimeout(() => html.classList.add("mo-safe"), 2500);

        const added = [];
        for (const [name, content] of METAS) {
            const m = document.createElement("meta");
            m.name = name; m.content = content;
            document.head.appendChild(m); added.push(m);
        }
        const loads = KIT_CSS.map((f) => new Promise((resolve) => {
            const l = document.createElement("link");
            l.rel = "stylesheet"; l.href = KIT + f;
            l.onload = resolve; l.onerror = resolve;
            document.head.appendChild(l); added.push(l);
        }));
        const style = document.createElement("style");
        style.textContent = ROOT_TOKENS + HOME_CSS;
        document.head.appendChild(style); added.push(style);

        let alive = true;
        Promise.all(loads).then(() => { if (alive) setReady(true); });

        return () => {
            alive = false;
            clearTimeout(t1); clearTimeout(t2);
            added.forEach((n) => n.remove());
            for (const [k, v] of Object.entries(prev)) { if (v === null) html.removeAttribute(k); else html.setAttribute(k, v); }
            if (prevLang === null) html.removeAttribute("lang"); else html.setAttribute("lang", prevLang);
            html.classList.remove("m-enter", "m-enter-done", "mo-js", "mo-safe");
        };
    }, []);

    // Скриптовете на кита (навигация, движение, моментите). При първия import се стартират сами;
    // при връщане на страницата ги стартираме отново върху новата маркировка.
    useEffect(() => {
        if (!ready) return;
        let cancelled = false;
        // Китът търси header, main, footer и nav.actionbar като преки деца на <body>
        // (body > nav.actionbar): местим ги там и ги връщаме в контейнера при излизане.
        const host = hostRef.current;
        const nodes = host ? [...host.children] : [];
        document.body.prepend(...nodes);
        // Вътрешните връзки (/calculator/ и т.н.) минават през React Router, без презареждане.
        const onClick = (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target.closest?.("a");
            const href = a?.getAttribute("href");
            if (!href || !href.startsWith("/") || href.startsWith("//")) return;
            e.preventDefault();
            navigate(href);
        };
        nodes.forEach((n) => n.addEventListener("click", onClick));
        (async () => {
            for (const f of KIT_JS) {
                const mod = await importKit(KIT + f);
                if (cancelled) return;
                if (kitScriptsLoaded) mod.default?.init?.();
            }
            kitScriptsLoaded = true;
        })().catch((err) => console.error("taste kit failed to load:", err));
        return () => {
            cancelled = true;
            nodes.forEach((n) => n.removeEventListener("click", onClick));
            if (host) host.append(...nodes);
        };
    }, [ready, navigate]);


    return (
        <>
            <Seo
                title="Калкулатор за приемен бал и кариерен тест"
                description={`Изчисли приемния си бал по формулите на ${UNIVERSITIES} университета, направи кариерния тест и сравни специалностите — безплатно. Прием ${ADMISSION_YEAR_SHORT} г.`}
                path="/"
            />
            <JsonLd data={HOME_SCHEMA} />
            <div
                ref={hostRef}
                className="taste-home"
                style={ready ? undefined : { visibility: "hidden" }}
                dangerouslySetInnerHTML={{ __html: HOME_HTML }}
            />
        </>
    );
}
