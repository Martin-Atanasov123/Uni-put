// Модул: fuzzySearch
// Описание: „Близки думи“ за търсачката — правописни грешки и друга форма на думата
//   („медицинна“, „психология“ → „психолог“, „компютри“ → „компютърни“). Работи върху
//   речник от думите в имената на специалностите, без външни библиотеки.
// Експорти: buildVocabulary, editDistance, closestWords, wordHasHit

const MIN_WORD = 4;

/** Речник от думите (≥4 букви, малки) в списък имена на специалности. */
export function buildVocabulary(names) {
    const vocab = new Set();
    for (const name of names || []) {
        for (const w of String(name).toLowerCase().split(/[^а-яa-z0-9]+/)) {
            if (w.length >= MIN_WORD) vocab.add(w);
        }
    }
    return vocab;
}

/** Разстояние на Левенщайн (оптимизирано за къси думи, с ранно прекъсване над `limit`). */
export function editDistance(a, b, limit = 3) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
            if (cur[j] < rowMin) rowMin = cur[j];
        }
        if (rowMin > limit) return limit + 1;
        prev = cur;
    }
    return prev[b.length];
}

const maxDistance = (len) => (len <= 5 ? 1 : 2);

function commonPrefix(a, b) {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
}

/** Дали думата (или негова форма от `variants`) вече се съдържа в някое име → няма нужда от разширяване. */
export function wordHasHit(variants, vocab) {
    for (const v of variants) {
        if (!v) continue;
        for (const w of vocab) if (w.includes(v)) return true;
    }
    return false;
}

/**
 * Най-близките думи от речника до `word`: по разстояние на Левенщайн ИЛИ по дълъг общ префикс
 * (друга форма на същата дума). Най-близките първи; до `max` резултата.
 */
export function closestWords(word, vocab, max = 4) {
    const w = String(word || "").toLowerCase();
    if (w.length < MIN_WORD || !vocab?.size) return [];
    const limit = maxDistance(w.length);
    const scored = [];
    for (const cand of vocab) {
        if (cand === w) continue;
        const d = editDistance(w, cand, limit);
        const prefix = commonPrefix(w, cand);
        const sameFamily = prefix >= Math.max(5, Math.ceil(0.7 * Math.min(w.length, cand.length)));
        // Правописна грешка рядко е в първата буква: по-далечни думи (d=2) трябва да започват еднакво,
        // иначе „психлогия“ би хванало „биология“.
        const typo = d <= 1 || (d <= limit && cand[0] === w[0]);
        if (typo || sameFamily) scored.push({ cand, score: typo ? d : limit + 1 + (Math.max(w.length, cand.length) - prefix) });
    }
    return scored.sort((a, b) => a.score - b.score || a.cand.localeCompare(b.cand, "bg")).slice(0, max).map((x) => x.cand);
}

// ── Съвпадане по имена на специалности (независимо от реда и точната форма на думите) ──────────
const NAME_STOP = new Set(["на", "по", "за", "и", "в", "от", "с", "със", "към", "the", "and"]);

const tokens = (s) => String(s || "").toLowerCase().split(/[^а-яa-z0-9]+/).filter((w) => w.length >= 3 && !NAME_STOP.has(w));

/** Колко добре две думи си приличат (0 = не; 1 = същата дума/форма). Префикс, правописна грешка. */
export function wordSimilarity(a, b) {
    if (a === b) return 1;
    const p = commonPrefix(a, b);
    const minLen = Math.min(a.length, b.length);
    // „музикална“ ~ „музика“, „педагогически“ ~ „педагогика“: дълъг общ корен
    if (p >= Math.max(4, Math.ceil(0.7 * minLen))) return 0.9;
    if (a.length >= 4 && b.length >= 4 && editDistance(a, b, 2) <= (Math.max(a.length, b.length) <= 5 ? 1 : 2)) {
        return a[0] === b[0] || editDistance(a, b, 1) <= 1 ? 0.8 : 0;
    }
    return 0;
}

/**
 * Кои имена на специалности отговарят на заявката, без значение от реда на думите и точните форми.
 * „музикална педагогика“ → „Педагогика на обучението по музика“. Думи от заявката, които не прилягат на
 * никое име (град, университет), се връщат в `ignored` — търсят се отделно в базата.
 * @returns {{names: string[], ignored: string[]}} names най-добрите първи
 */
export function matchSpecialtyNames(query, names, { max = 40, minSim = 0.7 } = {}) {
    const qTokens = [...new Set(tokens(query))];
    if (!qTokens.length) return { names: [], ignored: [] };
    const entries = (names || []).map((n) => ({ n, t: tokens(n) }));
    // Дума от заявката е „специалностна“, само ако прилича на дума в поне едно име
    const useful = qTokens.filter((q) => entries.some((e) => e.t.some((w) => wordSimilarity(q, w) >= minSim)));
    const ignored = qTokens.filter((q) => !useful.includes(q));
    if (!useful.length) return { names: [], ignored };
    const scored = [];
    for (const e of entries) {
        let total = 0;
        let ok = true;
        for (const q of useful) {
            const best = Math.max(0, ...e.t.map((w) => wordSimilarity(q, w)));
            if (best < minSim) { ok = false; break; }
            total += best;
        }
        if (!ok) continue;
        // по-кратките имена (по-малко „допълнителни“ думи) са по-близки до търсеното
        scored.push({ n: e.n, score: total / useful.length - Math.max(0, e.t.length - useful.length) * 0.01 });
    }
    scored.sort((a, b) => b.score - a.score || a.n.localeCompare(b.n, "bg"));
    return { names: scored.slice(0, max).map((x) => x.n), ignored };
}
