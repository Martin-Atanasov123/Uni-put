// Модул: Администраторски панел за доклади от потребители
// Описание: Показва всички доклади за грешки, позволява филтриране по статус,
//   преглед на скрийншоти, добавяне на бележки и маркиране като решени.
//   Линк към AdminDashboard за бърза редакция на записа.
import { useState, useEffect } from "react";
import {
    Flag, CheckCircle2, Clock, Eye, MessageSquare, ExternalLink,
    Filter, RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
    XCircle, Search, Inbox
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const STATUS_CONFIG = {
    open: { label: "Отворен", color: "badge-warning", icon: Clock },
    in_progress: { label: "В работа", color: "badge-info", icon: RefreshCw },
    resolved: { label: "Решен", color: "badge-success", icon: CheckCircle2 },
    dismissed: { label: "Отхвърлен", color: "badge-ghost", icon: XCircle },
};

const TYPE_LABELS = {
    formula_error: "Грешна формула",
    wrong_info: "Неточна информация",
    missing_specialty: "Липсваща специалност",
    other: "Друго",
};

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("open");
    const [expandedId, setExpandedId] = useState(null);
    const [adminNotes, setAdminNotes] = useState({});
    const [saving, setSaving] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    const fetchReports = async () => {
        setLoading(true);
        let query = supabase
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false });

        if (filterStatus !== "all") {
            query = query.eq("status", filterStatus);
        }

        const { data, error } = await query;
        if (!error) setReports(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchReports(); }, [filterStatus]);

    const updateStatus = async (id, newStatus) => {
        setSaving((p) => ({ ...p, [id]: true }));
        const updates = { status: newStatus };
        if (newStatus === "resolved" || newStatus === "dismissed") {
            updates.resolved_at = new Date().toISOString();
        }

        await supabase.from("reports").update(updates).eq("id", id);
        setSaving((p) => ({ ...p, [id]: false }));
        fetchReports();
    };

    const saveNotes = async (id) => {
        if (!adminNotes[id]?.trim()) return;
        setSaving((p) => ({ ...p, [id]: true }));
        await supabase
            .from("reports")
            .update({ admin_notes: adminNotes[id].trim() })
            .eq("id", id);
        setSaving((p) => ({ ...p, [id]: false }));
        fetchReports();
    };

    const filteredReports = reports.filter((r) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.university_name?.toLowerCase().includes(q) ||
            r.specialty?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
    });

    const counts = reports.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-base-200/30 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                                <Flag size={20} className="text-warning" />
                            </div>
                            Доклади
                        </h1>
                        <p className="text-sm opacity-50 font-medium mt-1">
                            Доклади за грешки от потребители
                        </p>
                    </div>
                    <button onClick={fetchReports} className="btn btn-ghost btn-sm gap-2 rounded-xl">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Обнови
                    </button>
                </div>

                {/* Status filters */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: "all", label: "Всички" },
                        { key: "open", label: "Отворени" },
                        { key: "in_progress", label: "В работа" },
                        { key: "resolved", label: "Решени" },
                        { key: "dismissed", label: "Отхвърлени" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilterStatus(f.key)}
                            className={`btn btn-sm rounded-xl font-bold gap-1.5 ${
                                filterStatus === f.key ? "btn-primary" : "btn-ghost"
                            }`}
                        >
                            <Filter size={12} />
                            {f.label}
                            {f.key !== "all" && counts[f.key] > 0 && (
                                <span className="badge badge-sm">{counts[f.key]}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                    <input
                        type="text"
                        className="input input-bordered w-full pl-10 rounded-xl font-medium"
                        placeholder="Търси по университет, специалност или описание..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Reports list */}
                {loading ? (
                    <div className="text-center py-20 opacity-40">
                        <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
                        <p className="font-bold">Зареждане...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <Inbox size={48} className="mx-auto mb-3" />
                        <p className="font-black text-lg">Няма доклади</p>
                        <p className="text-sm font-medium">
                            {filterStatus !== "all" ? "Опитай друг филтър" : "Все още няма подадени доклади"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReports.map((report) => {
                            const isExpanded = expandedId === report.id;
                            const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.open;
                            const StatusIcon = statusConf.icon;

                            return (
                                <div
                                    key={report.id}
                                    className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                                >
                                    {/* Collapsed row */}
                                    <div
                                        className="p-5 flex items-center gap-4 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                                    >
                                        <div className={`badge ${statusConf.color} gap-1 font-bold shrink-0`}>
                                            <StatusIcon size={12} />
                                            {statusConf.label}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-sm truncate">
                                                    {report.university_name || "Общ доклад"}
                                                </span>
                                                {report.specialty && (
                                                    <span className="text-xs opacity-40 font-medium truncate">
                                                        / {report.specialty}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs opacity-50 font-medium mt-0.5 truncate">
                                                {report.description}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="badge badge-ghost badge-sm font-bold">
                                                {TYPE_LABELS[report.report_type] || report.report_type}
                                            </span>
                                            <p className="text-[10px] opacity-30 font-bold mt-1">
                                                {new Date(report.created_at).toLocaleDateString("bg-BG")}
                                            </p>
                                        </div>
                                        {isExpanded ? <ChevronUp size={16} className="opacity-30" /> : <ChevronDown size={16} className="opacity-30" />}
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 space-y-4 border-t border-base-200 pt-4">
                                            {/* Description */}
                                            <div className="p-4 bg-base-200/50 rounded-xl">
                                                <p className="text-xs font-black uppercase opacity-30 mb-2">Описание</p>
                                                <p className="text-sm font-medium whitespace-pre-wrap">{report.description}</p>
                                            </div>

                                            {/* Screenshot */}
                                            {report.screenshot_url && (
                                                <div>
                                                    <p className="text-xs font-black uppercase opacity-30 mb-2">Скрийншот</p>
                                                    <a
                                                        href={report.screenshot_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <img
                                                            src={report.screenshot_url}
                                                            alt="Report screenshot"
                                                            className="rounded-xl border border-base-200 max-h-60 object-cover object-top w-full hover:opacity-80 transition-opacity cursor-zoom-in"
                                                        />
                                                    </a>
                                                </div>
                                            )}

                                            {/* Admin notes */}
                                            <div>
                                                <p className="text-xs font-black uppercase opacity-30 mb-2 flex items-center gap-1">
                                                    <MessageSquare size={12} /> Бележки на администратора
                                                </p>
                                                <div className="flex gap-2">
                                                    <textarea
                                                        className="textarea textarea-bordered flex-1 rounded-xl text-sm font-medium min-h-[60px]"
                                                        placeholder="Добави бележка..."
                                                        value={adminNotes[report.id] ?? report.admin_notes ?? ""}
                                                        onChange={(e) =>
                                                            setAdminNotes((p) => ({ ...p, [report.id]: e.target.value }))
                                                        }
                                                    />
                                                    <button
                                                        onClick={() => saveNotes(report.id)}
                                                        disabled={saving[report.id]}
                                                        className="btn btn-primary btn-sm rounded-xl self-end"
                                                    >
                                                        Запази
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {report.status !== "in_progress" && report.status !== "resolved" && (
                                                    <button
                                                        onClick={() => updateStatus(report.id, "in_progress")}
                                                        disabled={saving[report.id]}
                                                        className="btn btn-info btn-sm rounded-xl font-bold gap-1"
                                                    >
                                                        <RefreshCw size={12} /> В работа
                                                    </button>
                                                )}
                                                {report.status !== "resolved" && (
                                                    <button
                                                        onClick={() => updateStatus(report.id, "resolved")}
                                                        disabled={saving[report.id]}
                                                        className="btn btn-success btn-sm rounded-xl font-bold gap-1"
                                                    >
                                                        <CheckCircle2 size={12} /> Реши
                                                    </button>
                                                )}
                                                {report.status !== "dismissed" && (
                                                    <button
                                                        onClick={() => updateStatus(report.id, "dismissed")}
                                                        disabled={saving[report.id]}
                                                        className="btn btn-ghost btn-sm rounded-xl font-bold gap-1 opacity-50"
                                                    >
                                                        <XCircle size={12} /> Отхвърли
                                                    </button>
                                                )}
                                                {report.status === "resolved" && (
                                                    <button
                                                        onClick={() => updateStatus(report.id, "open")}
                                                        disabled={saving[report.id]}
                                                        className="btn btn-warning btn-sm rounded-xl font-bold gap-1"
                                                    >
                                                        <AlertTriangle size={12} /> Отвори отново
                                                    </button>
                                                )}
                                                <a
                                                    href={`/admin?table=universities&search=${encodeURIComponent(report.specialty || report.university_name || "")}`}
                                                    className="btn btn-ghost btn-sm rounded-xl font-bold gap-1 ml-auto"
                                                >
                                                    <ExternalLink size={12} /> Редактирай в базата
                                                </a>
                                            </div>

                                            {/* Meta */}
                                            <div className="text-[10px] opacity-25 font-mono pt-2 border-t border-base-200 flex flex-wrap gap-4">
                                                <span>ID: {report.id.slice(0, 8)}</span>
                                                <span>User: {report.user_id?.slice(0, 8)}</span>
                                                <span>Създаден: {new Date(report.created_at).toLocaleString("bg-BG")}</span>
                                                {report.resolved_at && (
                                                    <span>Решен: {new Date(report.resolved_at).toLocaleString("bg-BG")}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
