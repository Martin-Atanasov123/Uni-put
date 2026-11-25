import { useState } from "react";
import { nmaScore } from "@/lib/nmaScore";

export default function NmaCalculator({ row, program }) {
    const [exam, setExam] = useState("");
    const [theory, setTheory] = useState("");
    const result = nmaScore(exam, theory === "yes" ? true : theory === "no" ? false : null);
    return (
        <section className="mb-4 rounded-2xl border p-5">
            <h3 className="text-xl font-bold">{row.specialty} · НМА</h3>
            <p className="my-3">Балът е три пъти оценката по специалността. При резултат „не“ на изпита по теория се отнема една точка. За класиране са нужни поне 12 точки и изпълнение на останалите условия за прием.</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1"><span>Оценка по специалността (4–6)</span>
                    <input className="input input-bordered w-full" inputMode="decimal" value={exam} onChange={event => setExam(event.target.value)} />
                </label>
                <label className="grid gap-1"><span>Изпит по теория и солфеж</span>
                    <select className="input input-bordered w-full" value={theory} onChange={event => setTheory(event.target.value)}>
                        <option value="">Избери резултат</option><option value="yes">Да</option><option value="no">Не</option>
                    </select>
                </label>
            </div>
            <p className="my-3 font-semibold" role="status">{result === null
                ? "Въведи оценка и резултат от теорията."
                : `Бал: ${result.score.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} от 18 · ${result.eligible ? "покрива прага от 12" : "под прага от 12"}`}</p>
            <a className="underline" href={program.url}>Официален справочник за прием</a>
        </section>
    );
}
