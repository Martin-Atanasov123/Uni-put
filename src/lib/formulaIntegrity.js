const maximumInputFor = key => key === "bonifikaciq" ? 1 : 6;

/** Check whether the structured inputs reproduce the program's published maximum. */
export function assessFormula({ coefficients, max_ball }) {
    let maximum = 0;
    if (!Array.isArray(coefficients) || !coefficients.length) return { issue: "missing" };
    for (const slot of coefficients) {
        if (!Array.isArray(slot?.alternatives) || !slot.alternatives.length) return { issue: "invalid" };
        let largest = 0;
        for (const alt of slot.alternatives) {
            if (typeof alt?.key !== "string" || !alt.key.trim()) return { issue: "invalid" };
            const coef = Number(alt.coef);
            if (!["number", "string"].includes(typeof alt.coef) || !Number.isFinite(coef) || coef <= 0) return { issue: "invalid" };
            largest = Math.max(largest, coef * maximumInputFor(alt.key));
        }
        maximum += largest;
    }
    const published = Number(max_ball);
    if (!Number.isFinite(published) || published <= 0) return { maximum, issue: "unknown-maximum" };
    return { maximum, issue: Math.abs(maximum - published) >= 0.01 ? "scale" : null };
}
