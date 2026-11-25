import { useState } from "react";
import { nbuFields, nbuScore, NBU_RULES_URL } from "@/lib/nbuScore";

export default function NbuCalculator({ row, program }) {
    const [values, setValues] = useState({});
    const result = program.weights && nbuScore(program.weights, values);
    return (
        <section className="mb-4 rounded-2xl border p-5">
            <h3 className="text-xl font-bold">{row.specialty} · НБУ</h3>
            {program.officialName && <p className="my-3">В каталога на НБУ програмата е посочена като „{program.officialName}“.</p>}
            {program.weights ? <>
                <p className="my-3">Бал за кандидат след средно образование. Въведи точките от едно явяване на ТОП и средната оценка от зрелостните изпити. Изчислението е преди индивидуални бонуси.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(program.weights).map(([key, weight]) => {
                        const { label, min, max } = nbuFields[key];
                        return <label key={key} className="grid gap-1">
                            <span>{label} ({min}–{max}) · {10 * weight}%</span>
                            <input className="input input-bordered w-full" inputMode="decimal" value={values[key] ?? ""}
                                onChange={event => setValues({ ...values, [key]: event.target.value })} />
                        </label>;
                    })}
                </div>
                <p className="my-3 font-semibold" role="status">{result.message ?? `Бал: ${result.score.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} от 1000 точки`}</p>
            </> : <p className="my-3">За тази програма условията изискват отделна проверка в НБУ.</p>}
            <a className="underline" href={program.url}>Официални условия за прием</a>
            {program.weights && <> · <a className="underline" href={NBU_RULES_URL}>Как НБУ преобразува оценките в точки</a></>}
        </section>
    );
}
