import { useState } from "react";
import { uardScore } from "@/lib/uardScore";

const fields = [
    ["bulgarian", "Български език от дипломата"],
    ["choice", "Избран предмет от дипломата"],
    ["exam", "Конкурсен изпит, ДЗИ или признат конкурсен изпит"],
];

export default function UardCalculator({ row, program }) {
    const [values, setValues] = useState({});
    const score = uardScore(values.bulgarian, values.choice, values.exam);
    return (
        <section className="mb-4 rounded-2xl border p-5">
            <h3 className="text-xl font-bold">{row.specialty} · ВУАРР</h3>
            <p className="my-3">Балът е средното от трите оценки по шестобалната система. Избраният предмет е математика, география и икономика, история и цивилизации, биология и здравно образование, химия и опазване на околната среда, икономика, информатика или чужд език.</p>
            <div className="grid gap-3 sm:grid-cols-3">
                {fields.map(([key, label]) => <label key={key} className="grid gap-1">
                    <span>{label} (3–6)</span>
                    <input className="input input-bordered w-full" inputMode="decimal" value={values[key] ?? ""}
                        onChange={event => setValues({ ...values, [key]: event.target.value })} />
                </label>)}
            </div>
            <p className="my-3 font-semibold" role="status">{score === null
                ? "Попълни трите оценки между 3 и 6."
                : `Бал: ${score.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} от 6`}</p>
            <a className="underline" href={program.url}>Официални условия за прием</a>
        </section>
    );
}
