import { ScrollText } from "lucide-react";

const SECTIONS = [
    {
        title: "1. Предмет",
        body: <p>Настоящите Условия за ползване уреждат отношенията между УниПът („ние", „платформата") и потребителите на нашите услуги. Използвайки Платформата, вие се съгласявате с тези условия.</p>,
    },
    {
        title: "2. Права и задължения на потребителите",
        body: (
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <li>Потребителят има право да използва калкулаторите и ресурсите на Платформата за лични, некомерсиални цели.</li>
                <li>Потребителят се задължава да не подава невярна информация при попълване на тестовете и калкулаторите.</li>
                <li>Забранено е използването на автоматизирани системи (скриптове, роботи) за извличане на данни от Платформата.</li>
            </ul>
        ),
    },
    {
        title: "3. Интелектуална собственост",
        body: <p>Всички материали, софтуерни кодове, алгоритми (включително RIASEC методологията и бал калкулаторите), дизайн и съдържание са собственост на УниПът или неговите лицензианти и са защитени от Закона за авторското право и сродните му права.</p>,
    },
    {
        title: "4. Ограничаване на отговорността",
        body: <p>УниПът предоставя информацията „във вида, в който е". Въпреки че се стремим към максимална точност, не носим отговорност за грешки в балообразуването или промени в университетските изисквания, които не са отразени своевременно. Окончателните резултати винаги трябва да се проверяват в официалните страници на съответните ВУЗ.</p>,
    },
    {
        title: "5. Прекратяване на акаунт",
        body: <p>Запазваме си правото да прекратим достъпа на потребители, които нарушават настоящите условия или се опитват да компрометират сигурността на Платформата.</p>,
    },
    {
        title: "6. Приложимо право",
        body: <p>За всички неуредени въпроси се прилага българското законодателство. Споровете ще се решават от компетентните съдилища в гр. София.</p>,
    },
];

const TermsOfService = () => {
    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", top: "-200px", right: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", pointerEvents: "none" }} />

            <div style={{ maxWidth: "820px", margin: "0 auto", position: "relative" }}>
                <div
                    style={{
                        background: "rgba(30,41,59,0.55)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(148,163,184,0.1)",
                        borderRadius: "1.5rem",
                        padding: "2.5rem 2rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                        <div
                            style={{
                                width: "2.5rem",
                                height: "2.5rem",
                                borderRadius: "0.75rem",
                                background: "rgba(6,182,212,0.12)",
                                border: "1px solid rgba(6,182,212,0.3)",
                                color: "var(--brand-cyan)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ScrollText size={20} />
                        </div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                                fontWeight: 800,
                                letterSpacing: "-0.02em",
                                background: "linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Условия за ползване
                        </h1>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", color: "var(--brand-muted)", fontSize: "14px", lineHeight: 1.7 }}>
                        {SECTIONS.map(s => (
                            <section key={s.title}>
                                <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "var(--brand-text)", marginBottom: "0.5rem" }}>
                                    {s.title}
                                </h2>
                                {s.body}
                            </section>
                        ))}

                        <div style={{ height: "1px", background: "rgba(148,163,184,0.1)", margin: "0.5rem 0" }} />
                        <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic", opacity: 0.7 }}>
                            Последна актуализация: 26 март 2026 г.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
