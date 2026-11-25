import { useState } from "react";
import { tourismCollegeScore } from "@/lib/tourismCollegeScore";

const fields = [
    ["bulgarian", "Български език и литература от дипломата"],
    ["firstLanguage", "Първи чужд език от дипломата"],
    ["secondLanguage", "Втори чужд език от дипломата"],
    ["exam", "Избран ДЗИ, професионален изпит или изпит по английски"],
];

export default function TourismCollegeCalculator({ row, program }) {
    const [values, setValues] = useState({});
    const score = tourismCollegeScore(values.bulgarian, values.firstLanguage, values.secondLanguage, values.exam);
    return (
        <section className="mb-4 rounded-2xl border p-5">
            <h3 className="text-xl font-bold">{row.specialty} · Колеж по туризъм – Варна</h3>
            <p className="my-3">Прием за професионален бакалавър. Балът е сборът от четирите оценки; за четвъртата се избира допустим резултат според официалните условия.</p>
            <div className="grid gap-3 sm:grid-cols-2">
                {fields.map(([key, label]) => <label key={key} className="grid gap-1">
                    <span>{label} (3–6)</span>
                    <input className="input input-bordered w-full" inputMode="decimal" value={values[key] ?? ""}
                        onChange={event => setValues({ ...values, [key]: event.target.value })} />
                </label>)}
            </div>
            <p className="my-3 font-semibold" role="status">{score === null
                ? "Попълни четирите оценки между 3 и 6."
                : `Бал: ${score.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} от 24`}</p>
            <a className="underline" href={program.url}>Официални условия за прием</a>
        </section>
    );
}
