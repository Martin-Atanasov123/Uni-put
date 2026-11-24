// Обобщение на резултатите от калкулатора за долната лента на телефон (само четене).
export function summarizeResults(results) {
    const total = results.length;
    const complete = results.filter(r => r.hasStarted && !r.hasMissing);
    const missingCounts = results.filter(r => r.hasMissing).map(r => r.missingSlots.length);
    const fewestMissing = missingCounts.length ? Math.min(...missingCounts) : 0;
    return { total, complete: complete.length, fewestMissing, single: total === 1 ? results[0] : null };
}
