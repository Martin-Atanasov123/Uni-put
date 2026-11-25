import { useState } from "react";
import { vfuScore } from "@/lib/vfuScore";

export default function VfuCalculator({ row, program }) {
    const [exam, setExam] = useState("");
    const [diploma, setDiploma] = useState("");
    const [hasBonus, setHasBonus] = useState(false);
    const score = vfuScore(exam, diploma, hasBonus);
    return <section className="mb-4 rounded-2xl border p-5">
        <h3 className="text-xl font-bold">{row.specialty} · ВСУ</h3>
        <p className="my-3">Бал = 2 × най-високата призната конкурсна оценка + средния успех от дипломата. ВСУ признава и определени ДЗИ и други резултати като конкурсен изпит.</p>
        <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">Призната конкурсна оценка
                <input className="input input-bordered w-full" inputMode="decimal" placeholder="3,00 – 6,00" value={exam} onChange={event => setExam(event.target.value)} />
            </label>
            <label className="grid gap-1">Среден успех от дипломата
                <input className="input input-bordered w-full" inputMode="decimal" placeholder="3,00 – 6,00" value={diploma} onChange={event => setDiploma(event.target.value)} />
            </label>
        </div>
        <label className="my-3 flex items-start gap-2"><input type="checkbox" className="checkbox" checked={hasBonus} onChange={event => setHasBonus(event.target.checked)} />
            <span>Имам право на бонификация 1 точка. {program.bonus}</span>
        </label>
        <p role="status" className="my-3 font-semibold">{score === null ? "Въведи двете оценки между 3,00 и 6,00." : `Изчислен бал: ${score.toFixed(2)} от 19`}</p>
        <a className="underline" href={program.url}>Официални условия на ВСУ за специалността</a>
    </section>;
}
