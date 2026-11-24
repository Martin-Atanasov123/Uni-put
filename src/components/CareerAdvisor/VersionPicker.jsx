// Избор на версия на теста (радио група).
// Достъпност: името на всяка опция е само името на версията („Стандартна“);
// „Препоръчваме“, броят въпроси/времето и описанието са в описанието на полето
// (aria-describedby) — четат се след името, а не слепени в него.
// Описанието остава достъпно за екранен четец и когато визуално е скрито на телефон.
export default function VersionPicker({ versions, picked, onPick, legend = "Избери колко време имаш" }) {
    return (
        <fieldset>
            <legend>{legend}</legend>
            {versions.map(v => {
                const ids = {
                    name: `ca-v-${v.id}-name`,
                    rec: `ca-v-${v.id}-rec`,
                    meta: `ca-v-${v.id}-meta`,
                    desc: `ca-v-${v.id}-desc`,
                };
                const describedBy = [v.recommended && ids.rec, ids.meta, ids.desc].filter(Boolean).join(" ");
                return (
                    <label key={v.id} className={"ca-opt" + (v.recommended ? " ca-opt--rec" : "")}>
                        <input
                            type="radio"
                            name="riasec-version"
                            value={v.id}
                            checked={picked === v.id}
                            onChange={() => onPick(v.id)}
                            aria-labelledby={ids.name}
                            aria-describedby={describedBy}
                        />
                        <span className="ca-opt__name">
                            <span id={ids.name}>{v.name}</span>
                            {v.recommended && <span id={ids.rec} className="ca-pill">Препоръчваме</span>}
                        </span>
                        <span id={ids.desc} className="ca-opt__desc">{v.desc}</span>
                        <span className="ca-opt__meta" aria-hidden="true">
                            {v.questions} въпроса<small>{v.time}</small>
                        </span>
                        <span id={ids.meta} className="ca-sr">{`${v.questions} въпроса, ${v.time}`}</span>
                    </label>
                );
            })}
        </fieldset>
    );
}
