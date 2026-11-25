import { useState } from "react";
import { PLOVDIV_SOURCE, plovdivVariantScores } from "@/lib/plovdivScore";

export default function PlovdivCalculator({ row, program }) {
    const [grades, setGrades] = useState({});
    const scores = plovdivVariantScores(program, grades);
    const complete = scores.filter(score => score !== null);
    return <section className="mb-4 rounded-2xl border p-5">
        <h3 className="text-xl font-bold">{row.specialty} · Пловдивски университет</h3>
        <p className="my-3">Попълни вариантите, за които имаш оценки. Когато едно поле допуска няколко предмета, въведи най-високата си призната оценка.</p>
        {program.note && <p className="mb-3">{program.note}</p>}
        {program.variants.map((terms, index) => <fieldset key={index} className="mb-3 rounded-xl border p-3">
            <legend>Вариант {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(terms).map(([field, weight]) => <label key={field} className="grid gap-1">
                    <span>{program.fields[field]} · коефициент {weight}</span>
                    <input className="input input-bordered w-full" inputMode="decimal" placeholder="3,00 – 6,00"
                        value={grades[field] ?? ""} onChange={event => setGrades({ ...grades, [field]: event.target.value })} />
                </label>)}
            </div>
            {scores[index] !== null && <p>Бал по варианта: {scores[index].toFixed(2)}</p>}
        </fieldset>)}
        <p role="status" className="my-3 font-semibold">{complete.length
            ? `Най-висок бал от попълнените варианти: ${Math.max(...complete).toFixed(2)} от 36`
            : "За бал попълни всички оценки от поне един вариант (3,00–6,00)."}</p>
        <a className="underline" href={PLOVDIV_SOURCE}>ПУ · Приложение 1 за прием 2026/2027</a>
    </section>;
}
