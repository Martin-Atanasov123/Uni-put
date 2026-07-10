import { useEffect } from "react";

const SITE_URL = "https://uniput.eu";
const SITE_NAME = "УниПът";
// Default OG e branded 1200×630 шаблон (генериран от scripts/generate-og-images.mjs).
// Per-page override-ва се чрез `image` prop. Платформи като Facebook кешират по URL,
// затова рядко променяме файла; ако се промени дизайнът — нов filename или append ?v=N.
const DEFAULT_IMAGE = `${SITE_URL}/og/default.png`;

/**
 * Per-страница SEO мета тагове. React 19 ги повдига автоматично в <head>,
 * затова компонентът просто се рендира някъде в дървото на страницата.
 *
 * @param {string} title        Заглавие на страницата (без суфикса с марката)
 * @param {string} description  Мета описание (max ~160 знака)
 * @param {string} path         Път на маршрута, напр. "/calculator" (за canonical + og:url)
 * @param {string} [image]      Абсолютен URL към OG изображение
 * @param {boolean} [noindex]   Ако е true — забранява индексиране (лични страници)
 */
export default function Seo({ title, description, path = "/", image = DEFAULT_IMAGE, noindex = false }) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    // Trailing slash е ЗАДЪЛЖИТЕЛЕН — Netlify 301-redirect-ва no-slash → slash,
    // затова canonical/og:url трябва да сочат към slash-версията (реалния 200 URL),
    // иначе Google вижда конфликт (canonical сочи към redirect-ващ URL).
    const canonical = `${SITE_URL}${path === "/" ? "/" : "/" + path.replace(/^\/|\/$/g, "") + "/"}`;

    // Премахва статичните default SEO тагове от index.html при първия mount, за да
    // няма дублиращи canonical / description тагове редом с per-route таговете долу.
    // Статичните остават в суровия HTML за crawler-и без JS.
    useEffect(() => {
        document.querySelectorAll("[data-seo-default]").forEach((el) => el.remove());
    }, []);

    return (
        <>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            <link rel="canonical" href={canonical} />
            <meta name="robots" content={noindex ? "noindex,follow" : "index,follow"} />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="bg_BG" />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            {description && <meta property="og:description" content={description} />}
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={fullTitle} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            {description && <meta name="twitter:description" content={description} />}
            <meta name="twitter:image" content={image} />
            <meta name="twitter:image:alt" content={fullTitle} />
        </>
    );
}
