// Кирилица → латиница транслитерация за SEO-friendly URL слъгове.
// ВАЖНО: този модул е single source of truth за слъг-генерацията.
// Sitemap скриптът и /universities/[slug] route-ът ТРЯБВА да го използват
// еднакво, иначе URL-ите в sitemap.xml ще се разминават с реалните routes.

const CYR_TO_LAT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sht", "ъ": "a",
    "ь": "y", "ю": "yu", "я": "ya",
};

export function slugify(input) {
    if (!input) return "";
    const lower = String(input).toLowerCase().trim();
    let out = "";
    for (const ch of lower) {
        if (CYR_TO_LAT[ch] !== undefined) out += CYR_TO_LAT[ch];
        else if (/[a-z0-9]/.test(ch)) out += ch;
        else if (/[\s\-_./\\]/.test(ch)) out += "-";
        // всичко друго (препинателни знаци, скоби) се игнорира
    }
    return out
        .replace(/-+/g, "-")       // нормализирай поредици от тирета
        .replace(/^-+|-+$/g, "");  // тримни тирета в краищата
}
