// Административен панел (CRUD) за управление на данни по конфигурация.
// Включва: динамични формуляри, таблица със селекция/филтър/пагинация,
// bulk действия, експорт в CSV и резервно копие в JSON, както и локален одит лог.
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Database, CheckCircle, AlertCircle, LayoutDashboard, Filter, Trash2,
    Edit2, PlusCircle, Download, RefreshCw, Search, ChevronLeft,
    ChevronRight, Info, HelpCircle, X, Check, Save, History,
    FileJson, FileSpreadsheet, Settings, ExternalLink, Flag
} from "lucide-react";
import { ADMIN_TABLES } from "./adminConfig";
import { adminService } from "@/services/adminService";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AdminDashboard = () => {
    const navigate = useNavigate();

    // --- State Management ---
    const [activeTableId, setActiveTableId] = useState(ADMIN_TABLES[0].id);
    const [query, setQuery] = useState("");
    const [selection, setSelection] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [status, setStatus] = useState({ type: null, msg: "" });
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const currentPageRef = useRef(0);
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Активна таблица според избора от sidebar
    const activeTable = useMemo(
        () => ADMIN_TABLES.find((t) => t.id === activeTableId),
        [activeTableId]
    );

    const [dataPage, setDataPage] = useState({
        items: [],
        total: 0,
        page: 0,
        pages: 0
    });

    // --- Audit Log Persistence (Database) ---
    const loadAuditLog = async () => {
        try {
            const { data, error } = await supabase
                .from("admin_audit_log")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            setAuditLog((data || []).map(entry => ({
                id: entry.id,
                time: entry.created_at,
                action: entry.action,
                table: entry.table_name,
                payload: entry.payload
            })));
        } catch {
            setAuditLog([]);
        }
    };

    const appendAuditEntry = async (action, table, payload) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from("admin_audit_log")
                .insert([{ admin_id: user.id, action, table_name: table, payload }])
                .select()
                .single();
            if (error) throw error;
            const entry = {
                id: data.id,
                time: data.created_at,
                action: data.action,
                table: data.table_name,
                payload: data.payload
            };
            setAuditLog(prev => [entry, ...prev].slice(0, 50));
        } catch {
            // audit write failed silently
        }
    };

    // --- Data Fetching ---
    const loadData = useCallback(async (opts = {}) => {
        if (!activeTable) return;
        setLoading(true);
        try {
            const targetPage = opts.page ?? currentPageRef.current;
            const result = await adminService.list(activeTable.table, {
                page: targetPage,
                filters: { query },
                useCache: opts.useCache !== false
            });
            setDataPage(result);
            setSelection([]);
            if (opts.page !== undefined) {
                currentPageRef.current = opts.page;
                setCurrentPage(opts.page);
            }
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при зареждане: " + err.message });
        } finally {
            setLoading(false);
        }
    }, [activeTable, query]);

    useEffect(() => {
        loadAuditLog();
    }, []);

    useEffect(() => {
        // Reset to page 0 when table or query changes
        currentPageRef.current = 0;
        setCurrentPage(0);
        loadData({ page: 0 });
    }, [activeTableId, query, loadData]);

    // --- Real-time Subscription ---
    useEffect(() => {
        if (!activeTable) return;

        // Инициализиране на Real-time канал за текущата таблица.
        // Това позволява автоматично обновяване на UI при INSERT, UPDATE или DELETE събития в Supabase.
        const channel = supabaseAdmin
            .channel(`admin_realtime_${activeTable.table}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: activeTable.table },
                () => {
                    // При всяка промяна в БД презареждаме данните, като игнорираме локалния кеш.
                    loadData({ useCache: false });
                }
            )
            .subscribe();

        return () => {
            // Премахване на субскрипцията при смяна на таблица или демонтиране на компонента.
            supabaseAdmin.removeChannel(channel);
        };
    }, [activeTable, loadData]);

    // --- Manual Refresh Handler ---
    const handleManualRefresh = async () => {
        setRefreshing(true);
        setStatus({ type: null, msg: "" });
        try {
            // Презареждане на данните чрез изрично прескачане на кеша (useCache: false)
            await loadData({ useCache: false });
            setStatus({ type: "success", msg: "Данните бяха синхронизирани успешно." });
            
            // Автоматично изчистване на съобщението за успех след 3 секунди
            setTimeout(() => {
                setStatus((prev) => prev.msg === "Данните бяха синхронизирани успешно." ? { type: null, msg: "" } : prev);
            }, 3000);
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при синхронизация: " + err.message });
        } finally {
            setRefreshing(false);
        }
    };

    // --- CRUD Handlers ---
    const openCreate = () => {
        if (!activeTable) return;
        const initial = {};
        activeTable.fields.forEach((f) => {
            initial[f.id] = f.type === "boolean" ? false : "";
        });
        setEditingRow(null);
        setFormValues(initial);
        // Scroll to form for mobile UX
        window.scrollTo({ top: document.getElementById('admin-form')?.offsetTop - 100, behavior: 'smooth' });
    };

    const openEdit = (row) => {
        if (!activeTable) return;
        const initial = {};
        activeTable.fields.forEach((f) => {
            const value = row[f.id];
            if (f.type === "json") {
                initial[f.id] = value ? JSON.stringify(value, null, 2) : "";
            } else {
                initial[f.id] = value == null ? "" : value;
            }
        });
        setEditingRow(row);
        setFormValues(initial);
        window.scrollTo({ top: document.getElementById('admin-form')?.offsetTop - 100, behavior: 'smooth' });
    };

    const handleFormChange = (fieldId, value) => {
        setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const parsePayload = () => {
        if (!activeTable) return {};
        const payload = {};
        activeTable.fields.forEach((f) => {
            const v = formValues[f.id];
            if (f.type === "number" && v !== "") {
                const num = parseFloat(v);
                payload[f.id] = Number.isNaN(num) ? null : num;
            } else if (f.type === "json" && v) {
                try {
                    payload[f.id] = JSON.parse(v);
                } catch {
                    throw new Error(`Невалиден JSON в поле: ${f.label}`);
                }
            } else if (f.type === "boolean") {
                payload[f.id] = !!v;
            } else {
                payload[f.id] = v === "" ? null : v;
            }
        });
        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeTable) return;
        setStatus({ type: "loading", msg: "Записване..." });
        try {
            const missing = activeTable.fields
                .filter((f) => f.required)
                .filter((f) => {
                    const v = formValues[f.id];
                    return v == null || v === "";
                });
            if (missing.length > 0) {
                const names = missing.map((f) => f.label).join(", ");
                setStatus({ type: "error", msg: `Липсват задължителни полета: ${names}` });
                return;
            }
            const payload = parsePayload();
            if (editingRow) {
                await adminService.update(
                    activeTable.table,
                    activeTable.primaryKey,
                    editingRow[activeTable.primaryKey],
                    payload
                );
                appendAuditEntry("UPDATE", activeTable.table, { id: editingRow[activeTable.primaryKey], payload });
                setStatus({ type: "success", msg: "Записът е обновен успешно." });
            } else {
                const created = await adminService.create(activeTable.table, payload);
                appendAuditEntry("CREATE", activeTable.table, created);
                setStatus({ type: "success", msg: "Нов запис е създаден успешно." });
            }
            setEditingRow(null);
            setFormValues({});
            await loadData({ useCache: false });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при запис: " + err.message });
        }
    };

    // --- Bulk Actions ---
    const toggleSelection = (id) => {
        setSelection((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (!activeTable) return;
        if (selection.length === dataPage.items.length) {
            setSelection([]);
        } else {
            setSelection(dataPage.items.map((row) => row[activeTable.primaryKey]));
        }
    };

    const handleBulkDelete = async () => {
        if (!activeTable || selection.length === 0) return;
        if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${selection.length} избрани записа?`)) return;
        
        setStatus({ type: "loading", msg: "Изтриване..." });
        try {
            await adminService.removeMany(activeTable.table, activeTable.primaryKey, selection);
            appendAuditEntry("DELETE", activeTable.table, { ids: selection });
            setSelection([]);
            setStatus({ type: "success", msg: "Избраните записи са изтрити." });
            await loadData({ useCache: false });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при изтриване: " + err.message });
        }
    };

    // --- Exports ---
    const exportCsv = async () => {
        if (!activeTable) return;
        setStatus({ type: "loading", msg: "Експорт..." });
        try {
            const rows = await adminService.exportAll(activeTable.table);
            if (!rows.length) {
                setStatus({ type: "success", msg: "Няма данни за експорт." });
                return;
            }
            const headers = Object.keys(rows[0]);
            const csvRows = [
                headers.join(","),
                ...rows.map((row) =>
                    headers
                        .map((h) => {
                            const value = row[h];
                            if (value == null) return "";
                            if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                            return `"${String(value).replace(/"/g, '""')}"`;
                        })
                        .join(",")
                )
            ];
            const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${activeTable.id}_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            setStatus({ type: "success", msg: "CSV файлът е изтеглен." });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при експорт: " + err.message });
        }
    };

    const exportBackupJson = async () => {
        setStatus({ type: "loading", msg: "Създаване на бекъп..." });
        try {
            const payload = {};
            for (const table of ADMIN_TABLES) {
                payload[table.id] = await adminService.exportAll(table.table);
            }
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `uniput_full_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            setStatus({ type: "success", msg: "Пълен бекъп е изтеглен." });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при бекъп: " + err.message });
        }
    };

    // --- UI Helpers ---
    const getStatusClass = (type) => {
        switch (type) {
            case "success": return "bg-success/10 text-success border-success/20";
            case "error": return "bg-error/10 text-error border-error/20";
            case "loading": return "bg-info/10 text-info border-info/20 animate-pulse";
            default: return "hidden";
        }
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content font-sans antialiased">
            {/* --- Overlay for Mobile Sidebar --- */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* --- Sidebar --- */}
            <aside className={`
                fixed top-[88px] left-0 h-[calc(100%-88px)] w-[280px] bg-base-200 border-r border-base-content/5 z-50 
                transition-transform duration-300 ease-in-out lg:translate-x-0
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="flex flex-col h-full p-6">
                    {/* Sidebar Header */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content shadow-lg shadow-primary/20">
                            <LayoutDashboard size={22} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black leading-tight tracking-tight uppercase">Admin Panel</h1>
                            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">УниПът System</p>
                        </div>
                        <button 
                            className="ml-auto lg:hidden btn btn-ghost btn-sm btn-square"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1.5 flex-1">
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-3 mb-2">Таблици с данни</p>
                        {ADMIN_TABLES.map((table) => (
                            <button
                                key={table.id}
                                onClick={() => {
                                    setActiveTableId(table.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                                    ${activeTableId === table.id
                                        ? "bg-primary text-primary-content shadow-md shadow-primary/10"
                                        : "hover:bg-base-300 text-base-content/70 hover:text-base-content"
                                    }
                                `}
                            >
                                <Database size={18} className={activeTableId === table.id ? "opacity-100" : "opacity-50"} />
                                {table.label}
                                {activeTableId === table.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        ))}

                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-3 mb-2 mt-4">Обратна връзка</p>
                        <button
                            onClick={() => {
                                setIsSidebarOpen(false);
                                navigate("/admin/reports");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-base-300 text-base-content/70 hover:text-base-content"
                        >
                            <Flag size={18} className="opacity-50" />
                            Докладвания
                        </button>
                    </nav>

                    {/* Sidebar Footer - Audit Log Mini */}
                    <div className="mt-auto pt-6 border-t border-base-content/10">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Последна активност</p>
                            <History size={12} className="opacity-40" />
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {auditLog.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="p-2.5 rounded-lg bg-base-100 border border-base-content/5 text-[11px] leading-tight">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            entry.action === 'CREATE' ? 'bg-success' :
                                            entry.action === 'UPDATE' ? 'bg-info' : 'bg-error'
                                        }`} />
                                        <span className="font-bold uppercase opacity-80">{entry.action}</span>
                                    </div>
                                    <p className="opacity-60 truncate">{entry.table}</p>
                                </div>
                            ))}
                            {auditLog.length === 0 && (
                                <p className="text-[11px] opacity-30 italic px-1">Няма регистрирани действия</p>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            <main className="lg:ml-[280px] min-h-screen transition-all duration-300 pt-[88px]">
                {/* --- Top Header Bar --- */}
                <header className="sticky top-[88px] bg-base-100/80 backdrop-blur-md border-b border-base-content/5 z-30 px-4 md:px-8 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                className="lg:hidden btn btn-ghost btn-sm btn-square"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Settings size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">{activeTable?.label}</h2>
                                <p className="text-xs opacity-50 font-medium hidden sm:block">Системен модул за управление на информация</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-2 bg-base-200 rounded-xl px-3 py-1.5 border border-base-content/5 focus-within:border-primary/50 transition-colors">
                                <Search size={16} className="opacity-40" />
                                <input 
                                    type="text"
                                    placeholder="Търсене..."
                                    className="bg-transparent border-none outline-none text-sm w-48 lg:w-64"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleManualRefresh}
                                disabled={loading || refreshing}
                                className={`btn btn-ghost btn-sm btn-square rounded-xl transition-all ${refreshing ? "bg-primary/10 text-primary" : ""}`}
                                title="Обнови данните"
                            >
                                <RefreshCw size={18} className={loading || refreshing ? "animate-spin" : ""} />
                            </button>
                            {status.msg && (status.type === "success" || status.type === "error") && !editingRow && Object.keys(formValues).length === 0 && (
                                <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold animate-in fade-in slide-in-from-right-2 ${getStatusClass(status.type)}`}>
                                    {status.type === "success" ? <Check size={12} /> : <AlertCircle size={12} />}
                                    {status.msg}
                                </div>
                            )}
                            <div className="h-6 w-px bg-base-content/10 mx-1 hidden sm:block" />
                            <button 
                                onClick={() => setShowOnboarding(true)}
                                className="btn btn-ghost btn-sm btn-square rounded-xl text-primary"
                                title="Помощ"
                            >
                                <HelpCircle size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                    {/* --- Onboarding Alert --- */}
                    {showOnboarding && (
                        <div className="relative bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                            <button 
                                onClick={() => setShowOnboarding(false)}
                                className="absolute top-4 right-4 text-primary/50 hover:text-primary transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center shrink-0">
                                <Info size={24} />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-primary">Добре дошли в административния панел!</h3>
                                    <p className="text-sm opacity-80 leading-relaxed">
                                        Това е вашият контролен център. Тук можете да управлявате университети, специалности и общежития с максимална ефективност.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">1</div>
                                        <p className="text-xs opacity-70">Изберете таблица от лявото меню</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">2</div>
                                        <p className="text-xs opacity-70">Използвайте "Нов запис" за добавяне</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">3</div>
                                        <p className="text-xs opacity-70">Експортирайте данни за Excel по всяко време</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Action Bar --- */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex flex-wrap gap-2">
                            <button onClick={openCreate} className="btn btn-primary btn-sm rounded-xl px-4 font-bold shadow-lg shadow-primary/20">
                                <PlusCircle size={16} /> Нов запис
                            </button>
                            <button 
                                onClick={handleBulkDelete} 
                                disabled={!selection.length}
                                className="btn btn-error btn-outline btn-sm rounded-xl px-4 font-bold disabled:opacity-30"
                            >
                                <Trash2 size={16} /> Изтрий избраните ({selection.length})
                            </button>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="dropdown dropdown-end flex-1 sm:flex-initial">
                                <label tabIndex={0} className="btn btn-ghost btn-sm rounded-xl px-4 border border-base-content/10 w-full">
                                    <Download size={16} /> Експорт
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-200 rounded-xl w-52 border border-base-content/5 mt-2">
                                    <li><button onClick={exportCsv} className="font-bold text-sm"><FileSpreadsheet size={16} /> CSV / Excel</button></li>
                                    <li><button onClick={exportBackupJson} className="font-bold text-sm"><FileJson size={16} /> Пълен Backup (JSON)</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* --- Main Table Section --- */}
                    <section className="bg-base-100 rounded-3xl border border-base-content/5 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-base-content/5 bg-base-200/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="opacity-40" />
                                <span className="text-[11px] font-bold opacity-40 uppercase tracking-widest">Данни в реално време</span>
                            </div>
                            <div className="text-[11px] font-bold opacity-60">
                                {dataPage.total} записа общо
                            </div>
                        </div>

                        <div className="overflow-x-auto overflow-y-hidden">
                            <table className="table table-md w-full border-separate border-spacing-0">
                                <thead className="bg-base-200/50">
                                    <tr>
                                        <th className="w-12 text-center bg-transparent">
                                            <input 
                                                type="checkbox" 
                                                className="checkbox checkbox-sm checkbox-primary rounded-md"
                                                checked={selection.length === dataPage.items.length && dataPage.items.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="w-12 text-center text-[11px] font-black uppercase tracking-wider text-base-content/60 py-4">Ред.</th>
                                        {activeTable?.fields.map((f) => (
                                            <th key={f.id} className="text-[11px] font-black uppercase tracking-wider text-base-content/60 py-4">
                                                {f.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-base-content/5">
                                    {dataPage.items.map((row) => (
                                        <tr key={row[activeTable.primaryKey]} className="hover:bg-base-200/30 transition-colors group">
                                            <td className="text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                                                    checked={selection.includes(row[activeTable.primaryKey])}
                                                    onChange={() => toggleSelection(row[activeTable.primaryKey])}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <button 
                                                    onClick={() => openEdit(row)}
                                                    className="btn btn-ghost btn-xs btn-square rounded-lg text-primary"
                                                    title="Редактирай"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                            {activeTable.fields.map((f) => (
                                                <td key={f.id} className="text-sm font-medium py-4 whitespace-nowrap max-w-[200px] truncate">
                                                    {f.type === "json" ? (
                                                        <span className="badge badge-ghost badge-sm font-mono text-[10px] rounded-md">JSON Data</span>
                                                    ) : f.type === "boolean" ? (
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${row[f.id] ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/30'}`}>
                                                            {row[f.id] ? <Check size={14} /> : <X size={14} />}
                                                        </div>
                                                    ) : (
                                                        row[f.id] || <span className="opacity-20">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {dataPage.items.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={activeTable?.fields.length + 3} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <Database size={48} />
                                                    <p className="text-sm font-bold">Няма намерени записи</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Pagination --- */}
                        <div className="p-6 bg-base-200/10 border-t border-base-content/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-xs font-bold opacity-40">
                                Страница {dataPage.page + 1} от {dataPage.pages || 1}
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    disabled={dataPage.page === 0}
                                    onClick={() => loadData({ page: dataPage.page - 1 })}
                                    className="btn btn-sm btn-ghost rounded-xl border border-base-content/5 px-4 disabled:opacity-30"
                                >
                                    <ChevronLeft size={16} /> Предишна
                                </button>
                                <button 
                                    disabled={dataPage.page + 1 >= dataPage.pages || dataPage.pages === 0}
                                    onClick={() => loadData({ page: dataPage.page + 1 })}
                                    className="btn btn-sm btn-ghost rounded-xl border border-base-content/5 px-4 disabled:opacity-30"
                                >
                                    Следваща <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* --- Dynamic Form Section --- */}
                    {(editingRow !== null || Object.keys(formValues).length > 0) && (
                        <section id="admin-form" className="bg-base-100 rounded-3xl border-2 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b border-base-content/5 bg-primary/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center">
                                        {editingRow ? <Edit2 size={24} /> : <PlusCircle size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black">{editingRow ? "Редактиране на запис" : "Добавяне на нов запис"}</h3>
                                        <p className="text-xs opacity-60 font-medium">Попълнете внимателно всички задължителни полета</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setEditingRow(null); setFormValues({}); }}
                                    className="btn btn-ghost btn-sm btn-square rounded-xl"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeTable.fields.map((field) => (
                                        <div key={field.id} className="form-control w-full space-y-2">
                                            <label className="flex items-center justify-between px-1">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-base-content/60">
                                                    {field.label}
                                                    {field.required && <span className="text-error ml-1">*</span>}
                                                </span>
                                                {field.type === "json" && (
                                                    <span className="text-[10px] opacity-40 font-mono">Format: Valid JSON</span>
                                                )}
                                            </label>

                                            {field.type === "json" ? (
                                                <textarea 
                                                    className="textarea textarea-bordered bg-base-200/50 rounded-xl font-mono text-xs h-32 focus:bg-base-100 transition-all"
                                                    placeholder='{ "key": "value" }'
                                                    value={formValues[field.id] || ""}
                                                    onChange={(e) => handleFormChange(field.id, e.target.value)}
                                                />
                                            ) : field.type === "boolean" ? (
                                                <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">
                                                    <input 
                                                        type="checkbox" 
                                                        className="toggle toggle-primary"
                                                        checked={!!formValues[field.id]}
                                                        onChange={(e) => handleFormChange(field.id, e.target.checked)}
                                                    />
                                                    <span className="text-sm font-bold opacity-60">
                                                        {formValues[field.id] ? "Активно / Включено" : "Изключено"}
                                                    </span>
                                                </div>
                                            ) : field.type === "select" ? (
                                                <select 
                                                    className="select select-bordered bg-base-200/50 rounded-xl font-bold text-sm focus:bg-base-100 transition-all"
                                                    required={field.required}
                                                    value={formValues[field.id] || ""}
                                                    onChange={(e) => handleFormChange(field.id, e.target.value)}
                                                >
                                                    <option value="">Изберете опция...</option>
                                                    {(field.options || []).map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input 
                                                    type={field.type || "text"}
                                                    step={field.step}
                                                    required={field.required}
                                                    className="input input-bordered bg-base-200/50 rounded-xl font-bold text-sm focus:bg-base-100 transition-all"
                                                    placeholder={`Въведете ${field.label.toLowerCase()}...`}
                                                    value={formValues[field.id] || ""}
                                                    onChange={(e) => handleFormChange(field.id, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-base-content/5">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="btn btn-primary btn-md rounded-xl px-10 font-black shadow-lg shadow-primary/30 w-full sm:w-auto"
                                    >
                                        <Save size={18} /> {editingRow ? "Запази промените" : "Създай нов запис"}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => { setEditingRow(null); setFormValues({}); }}
                                        className="btn btn-ghost btn-md rounded-xl px-6 font-bold w-full sm:w-auto"
                                    >
                                        Отказ
                                    </button>

                                    {status.msg && (
                                        <div className={`ml-auto flex items-center gap-3 px-6 py-3 rounded-xl border text-sm font-bold animate-in fade-in zoom-in duration-300 ${getStatusClass(status.type)}`}>
                                            {status.type === "success" && <CheckCircle size={18} />}
                                            {status.type === "error" && <AlertCircle size={18} />}
                                            {status.msg}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </section>
                    )}

                    {/* --- Footer Stats --- */}
                    <footer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                        {[
                            { label: "Активни Таблици", value: ADMIN_TABLES.length, icon: Database, color: "text-primary" },
                            { label: "Общо Записи", value: dataPage.total, icon: FileJson, color: "text-info" },
                            { label: "Избрани Елементи", value: selection.length, icon: CheckCircle, color: "text-success" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-base-100 p-6 rounded-2xl border border-base-content/5 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center ${stat.color}`}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{stat.label}</p>
                                    <p className="text-xl font-black">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </footer>
                </div>
            </main>

            {/* --- Global Styles --- */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--bc), 0.2); }
                @media (max-width: 1024px) { main { margin-left: 0 !important; } }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
