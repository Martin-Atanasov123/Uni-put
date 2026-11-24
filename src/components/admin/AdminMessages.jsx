// Съобщения от формата „Пиши ни“ (public.contact_messages). Чете се само от админ (RLS).
import { useState, useEffect, useCallback } from "react";
import { Mail, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminMessages() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        let q = supabase
            .from("contact_messages")
            .select("id,created_at,name,email,message,status")
            .order("created_at", { ascending: false })
            .limit(100);
        if (!showAll) q = q.eq("status", "new");
        const { data, error } = await q;
        if (!error) setRows(data || []);
        setLoading(false);
    }, [showAll]);

    useEffect(() => { load(); }, [load]);

    const mark = async (id, status) => {
        await supabase.from("contact_messages").update({ status }).eq("id", id);
        load();
    };

    return (
        <section className="space-y-4" aria-labelledby="adm-msg">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="adm-msg" className="text-2xl font-black flex items-center gap-2">
                    <Mail size={20} /> Съобщения от сайта
                </h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowAll(v => !v)} className="btn btn-ghost btn-sm rounded-xl font-bold">
                        {showAll ? "Само новите" : "Всички"}
                    </button>
                    <button onClick={load} className="btn btn-ghost btn-sm rounded-xl gap-2">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Обнови
                    </button>
                </div>
            </div>
            {!loading && rows.length === 0 && (
                <p className="text-sm opacity-60">{showAll ? "Още няма съобщения." : "Няма нови съобщения."}</p>
            )}
            <ul className="space-y-3">
                {rows.map(r => (
                    <li key={r.id} className="card bg-base-100 border border-base-200 rounded-2xl p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="font-bold">
                                {r.name || "Без име"} · <a className="link" href={`mailto:${r.email}`}>{r.email}</a>
                            </span>
                            <span className="opacity-60">{new Date(r.created_at).toLocaleString("bg-BG")} · {r.status === "new" ? "ново" : r.status === "read" ? "прочетено" : "отговорено"}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{r.message}</p>
                        {r.status !== "answered" && (
                            <div className="flex gap-2">
                                {r.status === "new" && <button onClick={() => mark(r.id, "read")} className="btn btn-ghost btn-xs rounded-lg">Прочетено</button>}
                                <button onClick={() => mark(r.id, "answered")} className="btn btn-success btn-xs rounded-lg gap-1"><Check size={12} /> Отговорено</button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
