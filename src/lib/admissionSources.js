export const VUM_ADMISSION_URL = "https://vum.bg/application-requirement-for-bachelor-degree-programmes/";
export const VFU_ADMISSION_URL = "https://ksp.vfu.bg/bakalavar/usloviya_za_priem/index25.php";
export const AUBG_ADMISSION_URL = "https://www.aubg.edu/admissions/bachelors/how-to-apply/";
export const AMVR_ADMISSION_URL = "https://www.mvr.bg/academy/прием/учебна-дейност/окс-бакалавър/baloobr_2021";
export const NVU_ADMISSION_URL = "https://www.nvu.bg/bg/priem-kursanti/baloobrazuvane-i-klasirane";
export const VVMU_ADMISSION_URL = "https://www.naval-acad.bg/application";

export function hasNonNumericAdmissions(row) {
    return row.university_name === "Висше училище по мениджмънт – Варна"
        || row.university_name === "Американски университет в България – Благоевград";
}

export function hasSpecialSelectionAdmissions(row) {
    const university = row.university_name || "";
    if (university.startsWith("Академия на Министерството на вътрешните работи")) {
        return [
            "Гранична полиция",
            "Пожарна и аварийна безопасност",
            "Противодействие на престъпността и опазване на обществения ред",
        ].includes(row.specialty);
    }
    if (university.startsWith("Национален военен университет")) {
        return row.specialty === "Организация и управление на военни формирования на тактическо ниво";
    }
    if (university.startsWith("Висше военноморско училище")) {
        return row.specialty === "Организация и управление на военни формирования (ВМС)";
    }
    return false;
}

export function admissionSource(row) {
    const databaseUrl = row.source_url;
    if (/^https?:\/\//i.test(databaseUrl)) {
        return {
            url: databaseUrl,
            label: row.source_publisher ? `Официален източник · ${row.source_publisher}` : "Официален източник",
            verifiedAt: row.verified_at || null,
        };
    }

    let fallback = null;
    if (row.university_name === "Висше училище по мениджмънт – Варна") fallback = { url: VUM_ADMISSION_URL, label: "Условия за прием във ВУМ" };
    else if (row.university_name === "Американски университет в България – Благоевград") fallback = { url: AUBG_ADMISSION_URL, label: "Условия за прием в АУБ" };
    else if (row.university_name === 'Варненски свободен университет „Черноризец Храбър”') fallback = { url: VFU_ADMISSION_URL, label: "Условия за прием във ВСУ" };
    else if (row.university_name?.startsWith("Академия на Министерството на вътрешните работи")) fallback = { url: AMVR_ADMISSION_URL, label: "Балообразуване в Академията на МВР" };
    else if (row.university_name?.startsWith("Национален военен университет")) fallback = { url: NVU_ADMISSION_URL, label: "Балообразуване в НВУ" };
    else if (row.university_name?.startsWith("Висше военноморско училище")) fallback = { url: VVMU_ADMISSION_URL, label: "Прием във ВВМУ" };

    if (fallback) return { ...fallback, verifiedAt: null };
    return /^https?:\/\//i.test(row.website_url)
        ? { url: row.website_url, label: "Към сайта на университета", verifiedAt: null }
        : null;
}
