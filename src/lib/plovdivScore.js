import { ADMISSION_YEAR } from "./siteStats.js";

export const PLOVDIV_SOURCE = "https://uni-plovdiv.bg/pages/index/1874/";
const speech = "За участие в класирането ПУ изисква и проверка на говорните и комуникативните способности.";
const diploma = "Общ успех от дипломата";
const bulgarian = "Кандидатстудентски изпит по български език или ДЗИ по БЕЛ";
const biology = "Оценка по биология от дипломата по правилата на ПУ";
const scienceVariants = [{ science: 6 }, { bulgarian: 4, biology: 2 }];

function education(names, examSubjects, dziSubjects) {
    return {
        names,
        fields: { exam: "Кандидатстудентски изпит: " + examSubjects, dzi: "ДЗИ: " + dziSubjects, diploma },
        variants: [{ exam: 6 }, { dzi: 5, diploma: 1 }],
        note: speech,
    };
}

// Appendix 1, main campus. Branch campuses have separate appendices.
const groups = [
    {
        names: ["Биология", "Молекулярна биология", "Медицинска биология", "Микробиология и вирусология", "Екология и ООС", "Фармацевтични биотехнологии"],
        fields: { science: "Изпит или ДЗИ по биология или химия, призната олимпиада по биология или допустим ДИППК", bulgarian, biology },
        variants: scienceVariants,
        note: "За ДИППК провери в Приложение 1 дали кодът на специалността ти е 8510101, 5240201, 5240401 или 5240402.",
    },
    {
        names: ["Биология и химия"],
        fields: { science: "Изпит или ДЗИ по биология, химия или физика, или призната олимпиада/състезание по биология", bulgarian, biology },
        variants: scienceVariants,
    },
    education(["Педагогика", "Социална педагогика", "Специална педагогика", "Социални дейности"],
        "български, английски, немски, френски или математика", "БЕЛ, английски, немски, френски, руски или математика"),
    education(["Начална училищна педагогика и чужд език"],
        "български, английски, математика или история", "БЕЛ, английски, математика или история"),
    education(["Начална училищна педагогика", "Предучилищна педагогика и чужд език", "Предучилищна педагогика", "Предучилищна и начална училищна педагогика"],
        "български, математика или история", "БЕЛ, математика или история"),
    {
        names: ["Психология"],
        fields: {
            exam: "Кандидатстудентски изпит по български, история, математика, биология, английски, немски, френски или испански",
            bel: "ДЗИ по БЕЛ",
            second: "ДЗИ по философия, история, математика, биология, английски, немски, френски, испански или руски",
        },
        variants: [{ exam: 6 }, { bel: 2, second: 4 }],
        note: speech,
    },
    {
        names: ["Руска филология", "Български език и руски език"],
        fields: {
            russian: "ДЗИ по руски език",
            recognized: "Призната оценка от олимпиада/състезание по руски или БЕЛ, или приравнен сертификат по руски",
            bulgarian,
            language: "Оценка от дипломата по руски, английски, френски, немски, испански или италиански",
        },
        variants: [{ russian: 6 }, { recognized: 6 }, { bulgarian: 3, language: 3 }],
    },
    {
        names: ["Педагогика на обучението по музика"],
        fields: {
            exam: "Кандидатстудентски изпит по музика",
            dzi: "ДЗИ по музика",
            instrument: "Оценка по музикален инструмент или пеене",
        },
        variants: [{ exam: 6 }, { dzi: 2, instrument: 4 }, { instrument: 6 }],
        note: speech,
    },
    {
        names: ["Джаз и поп изпълнителско изкуство", "Музика"],
        fields: {
            exam: "Кандидатстудентски изпит по музика",
            dzi: "ДЗИ по музика",
            instrument: "Оценка по музикален инструмент или пеене",
        },
        variants: [{ exam: 6 }, { dzi: 2, instrument: 4 }],
    },
];

const byName = new Map(groups.flatMap(group => group.names.map(name => [name, group])));

export function plovdivProgram(row) {
    if (row.university_name !== 'Пловдивски университет „Паисий Хилендарски"' ||
        row.city !== "Пловдив" || (row.academic_year ?? ADMISSION_YEAR) !== "2026/2027") return null;
    return byName.get(row.specialty) ?? null;
}

export function plovdivVariantScores(program, grades) {
    return program.variants.map(terms => {
        let total = 0;
        for (const [field, weight] of Object.entries(terms)) {
            const text = String(grades[field] ?? "").trim().replace(",", ".");
            const grade = Number(text);
            if (!/^\d+(?:\.\d+)?$/.test(text) || grade < 3 || grade > 6) return null;
            total += weight * grade;
        }
        return total;
    });
}
