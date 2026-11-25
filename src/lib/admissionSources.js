export const VUM_ADMISSION_URL = "https://vum.bg/application-requirement-for-bachelor-degree-programmes/";
export const VFU_ADMISSION_URL = "https://ksp.vfu.bg/bakalavar/usloviya_za_priem/index25.php";
export const AUBG_ADMISSION_URL = "https://www.aubg.edu/admissions/bachelors/how-to-apply/";

export function hasNonNumericAdmissions(row) {
    return row.university_name === "Висше училище по мениджмънт – Варна"
        || row.university_name === "Американски университет в България – Благоевград";
}

export function admissionSource(row) {
    if (row.university_name === "Висше училище по мениджмънт – Варна") return { url: VUM_ADMISSION_URL, label: "Условия за прием във ВУМ" };
    if (row.university_name === "Американски университет в България – Благоевград") return { url: AUBG_ADMISSION_URL, label: "Условия за прием в АУБ" };
    if (row.university_name === 'Варненски свободен университет „Черноризец Храбър"') return { url: VFU_ADMISSION_URL, label: "Условия за прием във ВСУ" };
    const url = row.source_url || row.website_url;
    return /^https?:\/\//i.test(url) ? { url, label: "Към сайта на университета" } : null;
}
