// Споделяне на резултат като линк или PNG картинка (калкулатор, RIASEC).
// Без външни зависимости — работи във всеки браузър; на телефон отваря
// системното меню за споделяне, на компютър копира линка / тегли картинката.

export function copyText(text) {
    if (window.isSecureContext && navigator.clipboard) {
        return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    fallbackCopy(text);
    return Promise.resolve();
}

function fallbackCopy(text) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try { document.execCommand("copy"); } catch { /* без clipboard — нищо не можем да направим */ }
    document.body.removeChild(el);
}

export function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
        const test = cur ? cur + " " + w : w;
        if (ctx.measureText(test).width > maxWidth && cur) {
            lines.push(cur); cur = w;
        } else {
            cur = test;
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

export function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** @returns {Promise<"shared"|"copied"|"cancelled">} */
export async function shareOrCopyLink({ title, text, url }) {
    try {
        if (navigator.share) {
            await navigator.share({ title, text, url });
            return "shared";
        }
    } catch (err) {
        if (err?.name === "AbortError") return "cancelled";
    }
    await copyText(`${text} ${url}`);
    return "copied";
}

/** @returns {Promise<"shared"|"downloaded"|"cancelled"|null>} null — браузърът не върна PNG */
export async function shareOrDownloadCanvas(canvas, fileName, title) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) return null;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title });
            return "shared";
        }
    } catch (err) {
        if (err?.name === "AbortError") return "cancelled";
    }
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
    return "downloaded";
}
