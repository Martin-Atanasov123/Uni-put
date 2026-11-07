// Български текстове за вградената браузърна валидация на форми.
// Без това Chrome/Firefox показват "Please fill out this field." на английски.
// Слуша глобално (capture) — не пипа формите една по една.

function messageFor(el) {
    const v = el.validity;
    if (v.valueMissing) return el.type === "checkbox" ? "Отбележи това поле, за да продължиш." : "Попълни това поле.";
    if (v.typeMismatch) return el.type === "email" ? "Въведи валиден имейл адрес, например ime@primer.bg." : "Въведи стойност в правилния формат.";
    if (v.tooShort) return `Въведи поне ${el.minLength} символа.`;
    if (v.tooLong) return `Въведи най-много ${el.maxLength} символа.`;
    if (v.rangeUnderflow) return `Стойността трябва да е поне ${el.min}.`;
    if (v.rangeOverflow) return `Стойността трябва да е най-много ${el.max}.`;
    if (v.patternMismatch) return el.title || "Въведи стойност в правилния формат.";
    return "";
}

export function installBulgarianValidation() {
    if (typeof document === "undefined" || document.__bgValidation) return;
    document.__bgValidation = true;
    document.addEventListener(
        "invalid",
        (e) => {
            const msg = messageFor(e.target);
            if (msg) e.target.setCustomValidity(msg);
        },
        true
    );
    // Изчисти персонализираното съобщение при следваща промяна, за да не блокира формата.
    document.addEventListener(
        "input",
        (e) => {
            if (e.target?.setCustomValidity) e.target.setCustomValidity("");
        },
        true
    );
}
