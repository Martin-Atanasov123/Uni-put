import { ShieldCheck } from "lucide-react";

const SECTIONS = [
    {
        title: "1. Какви лични данни се събират?",
        body: (
            <>
                <p style={{ margin: "0 0 0.5rem" }}>Ние събираме и обработваме следните лични данни:</p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <li>Име и имейл адрес при регистрация.</li>
                    <li>История на отговорите в кариерния съветник и бал калкулатора.</li>
                    <li>IP адрес и технически данни при посещение на Платформата.</li>
                </ul>
            </>
        ),
    },
    {
        title: "2. Цели на обработката",
        body: (
            <>
                <p style={{ margin: "0 0 0.5rem" }}>Вашите данни се обработват единствено с цел:</p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <li>Осигуряване на достъп до персонализираните резултати.</li>
                    <li>Извършване на кариерни анализи и калкулации.</li>
                    <li>Подобряване на функционалността на Платформата.</li>
                </ul>
            </>
        ),
    },
    {
        title: "3. Срокове на съхранение",
        body: <p style={{ margin: 0 }}>Личните данни се съхраняват докато потребителят има активен акаунт. При изтриване на акаунта, данните се анонимизират за статистически цели или се изтриват напълно в срок от 30 дни.</p>,
    },
    {
        title: "4. Бисквитки (Cookies)",
        body: <p style={{ margin: 0 }}>Платформата използва функционални бисквитки за поддържане на сесията и localStorage за съхраняване на предпочитания и междинни резултати от тестовете.</p>,
    },
    {
        title: "5. Трети страни",
        body: <p style={{ margin: 0 }}>Данните ви не се предоставят на трети страни с комерсиална цел. Използваме Supabase за защитено съхранение на информацията в съответствие с техните стандарти за сигурност.</p>,
    },
    {
        title: "6. Вашите права по GDPR",
        body: <p style={{ margin: 0 }}>Имате право на достъп, коригиране, изтриване и преносимост на вашите данни. За упражняване на тези права можете да се свържете с нас на посочения в Платформата контакт.</p>,
    },
];

const PrivacyPolicy = () => {
    return (
        <div style={{ minHeight: "100vh", background: "var(--brand-bg)", color: "var(--brand-text)", padding: "7rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", top: "-200px", left: "-150px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)", pointerEvents: "none" }} />

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
                                background: "rgba(139,92,246,0.12)",
                                border: "1px solid rgba(139,92,246,0.3)",
                                color: "var(--brand-violet)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ShieldCheck size={20} />
                        </div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                                fontWeight: 800,
                                letterSpacing: "-0.02em",
                                background: "linear-gradient(135deg, var(--brand-violet), var(--brand-cyan))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Политика за поверителност
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

export default PrivacyPolicy;
