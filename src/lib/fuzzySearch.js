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
