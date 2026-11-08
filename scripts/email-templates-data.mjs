// Данни за имейлите на Supabase Auth (теми и съдържание). Рендерират се от
// supabase/functions/deadline-reminders/emailLayout.ts чрез scripts/build-email-templates.mjs.
const reason = (what) =>
    `Получаваш този имейл, защото ${what} <strong style="color:#CBD5E1;">{{ .Email }}</strong>.`;

const SAFE = {
    title: "Не си ти?",
};

export const templates = {
    "confirm-sign-up": {
        subject: "Потвърди имейла си — УниПът",
        options: {
            preheader: "Една стъпка до запазените ти оценки и специалности.",
            eyebrow: "Потвърди акаунта си",
            title: "Остана само да потвърдиш имейла",
            paragraphs: [
                "Регистрира се в УниПът с <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong>. Потвърди адреса и оценките, любимите специалности и резултатите ти ще те чакат на всяко устройство.",
            ],
            button: { label: "Потвърди имейла", url: "{{ .ConfirmationURL }}" },
            secondary: "След потвърждението те водим направо към калкулатора за бал.",
            note: { title: SAFE.title, text: "Ако не си се регистрирал ти, просто игнорирай този имейл — акаунтът няма да бъде активиран." },
            footerReason: reason("беше направена регистрация в УниПът с адрес"),
        },
    },
    "invite-user": {
        subject: "Покана за УниПът",
        options: {
            preheader: "Създадохме акаунт за теб — приеми поканата и избери парола.",
            eyebrow: "Покана",
            title: "Поканен си в УниПът",
            paragraphs: [
                "Създаден е акаунт за <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong>. Приеми поканата и избери парола, за да започнеш да изчисляваш бала си и да сравняваш университети.",
            ],
            button: { label: "Приеми поканата", url: "{{ .ConfirmationURL }}" },
            note: { title: "Не очакваш покана?", text: "Игнорирай този имейл — без да приемеш поканата, нищо не се променя." },
            footerReason: reason("някой те покани да се регистрираш с адрес"),
        },
    },
    "magic-link-or-otp": {
        subject: "Влез в УниПът с един клик",
        options: {
            preheader: "Твоят еднократен линк за вход.",
            eyebrow: "Вход без парола",
            title: "Твоят линк за вход",
            paragraphs: [
                "Натисни бутона, за да влезеш в профила си с <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong>. Линкът е за еднократна употреба и важи кратко време.",
            ],
            button: { label: "Влез в УниПът", url: "{{ .ConfirmationURL }}" },
            code: { label: "Или въведи този код", value: "{{ .Token }}" },
            note: { title: SAFE.title, text: "Ако не си поискал вход, игнорирай имейла. Никой няма достъп до акаунта ти без този линк." },
            footerReason: reason("беше поискан вход в УниПът с адрес"),
        },
    },
    "change-email-address": {
        subject: "Потвърди новия си имейл — УниПът",
        options: {
            preheader: "Потвърди смяната на имейла на акаунта ти.",
            eyebrow: "Смяна на имейл",
            title: "Потвърди новия си имейл",
            paragraphs: [
                "Поискана е смяна на имейла на акаунта ти от <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong> на <strong style=\"color:#F1F5F9;\">{{ .NewEmail }}</strong>. Потвърди, за да влезе в сила.",
            ],
            button: { label: "Потвърди новия имейл", url: "{{ .ConfirmationURL }}" },
            note: { title: SAFE.title, text: "Не натискай бутона — имейлът на акаунта ти остава непроменен. За сигурност смени паролата си от „Забравена парола“." },
            footerReason: reason("беше поискана смяна на имейла на акаунт"),
        },
    },
    "reset-password": {
        subject: "Смени паролата си — УниПът",
        options: {
            preheader: "Задай нова парола за акаунта си.",
            eyebrow: "Забравена парола",
            title: "Нова парола за акаунта ти",
            paragraphs: [
                "Получихме заявка за смяна на паролата на акаунта с <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong>. Натисни бутона и избери нова парола — отнема под минута.",
            ],
            button: { label: "Задай нова парола", url: "{{ .ConfirmationURL }}" },
            secondary: "Линкът е за еднократна употреба и важи кратко време.",
            note: { title: "Не си поискал смяна?", text: "Игнорирай този имейл — паролата ти остава същата и никой няма достъп до акаунта ти." },
            footerReason: reason("беше поискана смяна на парола за акаунт"),
        },
    },
    "reauthentication": {
        subject: "Код за потвърждение — УниПът",
        options: {
            preheader: "Въведи този код, за да потвърдиш, че си ти.",
            eyebrow: "Потвърждение за сигурност",
            title: "Потвърди, че си ти",
            paragraphs: [
                "За да продължиш с чувствителното действие в акаунта си, въведи този код:",
            ],
            code: { label: "Код за потвърждение", value: "{{ .Token }}" },
            note: { title: "Не го споделяй", text: "Кодът важи кратко време. От УниПът никога няма да ти го поискаме по телефон или в съобщение." },
            footerReason: reason("беше поискано потвърждение за акаунт"),
        },
    },
    "password-changed": {
        subject: "Паролата ти в УниПът беше сменена",
        options: {
            preheader: "Потвърждение за смяна на парола.",
            eyebrow: "Известие за сигурност",
            title: "Паролата ти беше сменена",
            paragraphs: [
                "Паролата на акаунта <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong> току-що беше променена. Не е нужно да правиш нищо.",
            ],
            button: { label: "Към УниПът", url: "{{ .SiteURL }}" },
            note: { title: SAFE.title, text: "Ако не си сменял паролата, задай нова веднага от „Забравена парола“ на страницата за вход — така прекъсваш чуждия достъп. Или ни пиши на uniput1000@gmail.com." },
            footerReason: reason("беше сменена паролата на акаунт"),
        },
    },
    "email-address-changed": {
        subject: "Имейлът на акаунта ти в УниПът беше сменен",
        options: {
            preheader: "Имейлът на акаунта ти е променен.",
            eyebrow: "Известие за сигурност",
            title: "Имейлът на акаунта ти беше сменен",
            paragraphs: [
                "Имейлът на акаунта ти беше сменен от <strong style=\"color:#F1F5F9;\">{{ .OldEmail }}</strong> на <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong>.",
            ],
            button: { label: "Към УниПът", url: "{{ .SiteURL }}" },
            note: { title: SAFE.title, text: "Ако не си поискал тази промяна, някой може да има достъп до акаунта ти. Смени паролата си веднага от „Забравена парола“ и ни пиши на uniput1000@gmail.com." },
            footerReason: "Получаваш това известие, защото адресът е бил свързан с акаунт в УниПът.",
        },
    },
    "sign-in-method-linked": {
        subject: "Нов начин за вход в акаунта ти — УниПът",
        options: {
            preheader: "Към акаунта ти е добавен нов начин за вход.",
            eyebrow: "Известие за сигурност",
            title: "Добавен е нов начин за вход",
            paragraphs: [
                "Към акаунта <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong> беше свързан нов начин за вход: <strong style=\"color:#F1F5F9;\">{{ .Provider }}</strong>.",
            ],
            button: { label: "Към УниПът", url: "{{ .SiteURL }}" },
            note: { title: SAFE.title, text: "Ако не си добавял този начин за вход, веднага смени паролата си от „Забравена парола“ и ни пиши на uniput1000@gmail.com." },
            footerReason: reason("беше свързан нов начин за вход към акаунт"),
        },
    },
    "sign-in-method-removed": {
        subject: "Премахнат е начин за вход в акаунта ти — УниПът",
        options: {
            preheader: "От акаунта ти е премахнат начин за вход.",
            eyebrow: "Известие за сигурност",
            title: "Премахнат е начин за вход",
            paragraphs: [
                "От акаунта <strong style=\"color:#F1F5F9;\">{{ .Email }}</strong> беше премахнат начин за вход: <strong style=\"color:#F1F5F9;\">{{ .Provider }}</strong>.",
            ],
            button: { label: "Към УниПът", url: "{{ .SiteURL }}" },
            note: { title: SAFE.title, text: "Ако не си премахвал този начин за вход, веднага смени паролата си от „Забравена парола“ и ни пиши на uniput1000@gmail.com." },
            footerReason: reason("беше премахнат начин за вход от акаунт"),
        },
    },
};

