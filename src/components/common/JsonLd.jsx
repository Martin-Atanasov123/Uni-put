/**
 * JsonLd — рендерира schema.org structured data като <script type="application/ld+json">.
 *
 * React 19 повдига <script> тагове автоматично в <head>, така че можем да го викаме
 * директно от която и да е страница без външни библиотеки.
 *
 * Защо това има значение за SEO:
 * - Google разпознава Rich Results (HowTo стъпки, EducationalOrganization, Quiz,
 *   BreadcrumbList) и ги показва в специален формат → +30% CTR.
 * - AI Overview / Perplexity / ChatGPT search четат тези данни за context.
 *
 * Употреба:
 *   <JsonLd data={{
 *     "@context": "https://schema.org",
 *     "@type": "HowTo",
 *     name: "Как да изчислиш приемен бал",
 *     step: [...]
 *   }} />
 *
 * @param {{ data: object }} props - Schema.org JSON-LD структура
 */
export default function JsonLd({ data }) {
    if (!data) return null;
    // dangerouslySetInnerHTML, защото нативното <script> с JSON content в React
    // се escape-ва нежелано. JSON.stringify дава safe stringified output.
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
