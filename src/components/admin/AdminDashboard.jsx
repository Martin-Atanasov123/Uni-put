// Административен панел (CRUD) за управление на данни по конфигурация.
// Включва: динамични формуляри, таблица със селекция/филтър/пагинация,
// bulk действия, експорт в CSV и резервно копие в JSON, както и локален одит лог.
import { useEffect, useMemo, useState } from "react";
import { Database, CheckCircle, AlertCircle, LayoutDashboard, Filter, Trash2, Edit2, PlusCircle, Download, RefreshCw } from "lucide-react";
import { ADMIN_TABLES } from "../../admin/adminConfig";
import { adminService } from "../../services/adminService";

const AdminDashboard = () => {
    // Състояние на екрана: активна таблица, странициране, търсачка, селекция,
    // текущо редактиран ред, стойности на формата, статуси, одит лог, loading.
    const [activeTableId, setActiveTableId] = useState(ADMIN_TABLES[0].id);
    const [pageState, setPageState] = useState({});
    const [query, setQuery] = useState("");
    const [selection, setSelection] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [status, setStatus] = useState({ type: null, msg: "" });
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(false);

    // Активна таблица според избора от sidebar; описва полета/ключове/етикети.
    const activeTable = useMemo(
        () => ADMIN_TABLES.find((t) => t.id === activeTableId),
        [activeTableId]
    );

    const currentPage = pageState[activeTableId]?.page || 0;
    const [dataPage, setDataPage] = useState({
        items: [],
        total: 0,
        page: 0,
        pages: 0
    });

    // Зареждане на последните действия от локалния одит лог (localStorage)
    const loadAuditLog = () => {
        try {
            const raw = window.localStorage.getItem("admin_audit_log_v1");
            if (!raw) {
                setAuditLog([]);
                return;
            }
            setAuditLog(JSON.parse(raw));
        } catch {
            setAuditLog([]);
        }
    };

    // Запазване на одит лога в localStorage (до ~50 записа)
    const persistAuditLog = (entries) => {
        try {
            window.localStorage.setItem("admin_audit_log_v1", JSON.stringify(entries));
        } catch {
            return;
        }
    };

    // Добавяне на запис (action/table/payload) в одит лога
    const appendAuditEntry = (action, table, payload) => {
        const entry = {
            id: Date.now(),
            time: new Date().toISOString(),
            action,
            table,
            payload
        };
        const next = [entry, ...auditLog].slice(0, 50);
        setAuditLog(next);
        persistAuditLog(next);
    };

    // Главна функция за четене на данни от adminService.list (кеш/филтър/странициране)
    const loadData = async (opts = {}) => {
        if (!activeTable) return;
        setLoading(true);
        setStatus({ type: null, msg: "" });
        try {
            const page = opts.page ?? currentPage;
            const result = await adminService.list(activeTable.table, {
                page,
                filters: { query },
                useCache: opts.useCache !== false
            });
            setDataPage(result);
            setSelection([]);
            setPageState((prev) => ({
                ...prev,
                [activeTable.id]: { page: result.page }
            }));
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при зареждане: " + err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuditLog();
    }, []);

    useEffect(() => {
        loadData({ page: 0 });
    }, [activeTableId, query]);

    const openCreate = () => {
        if (!activeTable) return;
        const initial = {};
        activeTable.fields.forEach((f) => {
            initial[f.id] = "";
        });
        setEditingRow(null);
        setFormValues(initial);
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
            } else if (f.type === "select") {
                payload[f.id] = v === "" ? null : v;
            } else {
                payload[f.id] = v === "" ? null : v;
            }
        });
        return payload;
    };

    // Създава или обновява запис според режима на формата (create/update).
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
                appendAuditEntry("update", activeTable.table, {
                    id: editingRow[activeTable.primaryKey],
                    payload
                });
                setStatus({ type: "success", msg: "Записът е обновен." });
            } else {
                const created = await adminService.create(activeTable.table, payload);
                appendAuditEntry("create", activeTable.table, created);
                setStatus({ type: "success", msg: "Нов запис е създаден." });
            }
            setEditingRow(null);
            await loadData({ useCache: false });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при запис: " + err.message });
        }
    };

    // Превключва селекцията на конкретен ред по неговия идентификатор.
    const toggleSelection = (id) => {
        setSelection((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Селектира всички/никакви видими редове на текущата страница.
    const toggleSelectAll = () => {
        if (!activeTable) return;
        if (selection.length === dataPage.items.length) {
            setSelection([]);
        } else {
            setSelection(dataPage.items.map((row) => row[activeTable.primaryKey]));
        }
    };

    // Масово изтриване на избраните записи; записва действие в одит лога.
    const handleBulkDelete = async () => {
        if (!activeTable || selection.length === 0) return;
        setStatus({ type: "loading", msg: "Изтриване на избраните записи..." });
        try {
            await adminService.removeMany(
                activeTable.table,
                activeTable.primaryKey,
                selection
            );
            appendAuditEntry("delete_many", activeTable.table, { ids: selection });
            setSelection([]);
            setStatus({ type: "success", msg: "Избраните записи са изтрити." });
            await loadData({ useCache: false });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при изтриване: " + err.message });
        }
    };

    // Експорт на всички записи от активната таблица към CSV (Excel-friendly).
    const exportCsv = async () => {
        if (!activeTable) return;
        setStatus({ type: "loading", msg: "Експорт в CSV..." });
        try {
            const rows = await adminService.exportAll(activeTable.table);
            if (!rows.length) {
                setStatus({ type: "success", msg: "Няма записи за експорт." });
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
                            if (typeof value === "object") {
                                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                            }
                            const str = String(value).replace(/"/g, '""');
                            return `"${str}"`;
                        })
                        .join(",")
                )
            ];
            const blob = new Blob([csvRows.join("\n")], {
                type: "text/csv;charset=utf-8;"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${activeTable.id}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            setStatus({ type: "success", msg: "Експортът в CSV е готов." });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при експорт: " + err.message });
        }
    };

    // Създава резервно копие (JSON) за всички таблици от конфигурацията.
    const exportBackupJson = async () => {
        setStatus({ type: "loading", msg: "Създаване на резервно копие..." });
        try {
            const payload = {};
            for (const table of ADMIN_TABLES) {
                const rows = await adminService.exportAll(table.table);
                payload[table.id] = rows;
            }
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "uniput_backup.json";
            link.click();
            URL.revokeObjectURL(url);
            setStatus({ type: "success", msg: "Резервното копие е изтеглено." });
        } catch (err) {
            setStatus({ type: "error", msg: "Грешка при резервното копие: " + err.message });
        }
    };

    return (
        <div className="min-h-screen pt-28 pb-10 px-4 md:px-8 bg-base-100">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-8">
                <aside className="bg-base-200/60 rounded-3xl p-5 md:p-6 border border-base-content/5 flex flex-col gap-6 h-full">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-4 rounded-2xl text-primary-content shadow-xl">
                            <LayoutDashboard size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">
                                Admin Hub
                            </h1>
                            <p className="text-xs opacity-60 font-medium">
                                System Management v2.0
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {ADMIN_TABLES.map((table) => (
                            <button
                                key={table.id}
                                onClick={() => setActiveTableId(table.id)}
                                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-bold transition-all ${
                                    activeTableId === table.id
                                        ? "bg-primary text-primary-content shadow-lg"
                                        : "bg-base-100 hover:bg-base-300/60"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Database size={16} />
                                    {table.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-base-content/10 space-y-2 text-xs">
                        <p className="font-bold opacity-60">Одит лог</p>
                        <div className="max-h-40 overflow-y-auto space-y-1 text-[11px]">
                            {auditLog.slice(0, 6).map((entry) => (
                                <div
                                    key={entry.id}
                                    className="px-2 py-1 rounded-xl bg-base-100 border border-base-content/5"
                                >
                                    <span className="font-bold uppercase text-[10px] opacity-60">
                                        {entry.action}
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span className="opacity-70">{entry.table}</span>
                                </div>
                            ))}
                            {auditLog.length === 0 && (
                                <span className="opacity-50">
                                    Няма действия до момента.
                                </span>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black">
                                {activeTable?.label}
                            </h2>
                            <p className="text-sm opacity-60">
                                Пълни CRUD операции, филтри, експорт и резервни копия.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={openCreate}
                                className="btn btn-primary btn-sm rounded-2xl font-black gap-2"
                            >
                                <PlusCircle size={16} />
                                Нов запис
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={!selection.length}
                                className="btn btn-error btn-sm rounded-2xl gap-2"
                            >
                                <Trash2 size={16} />
                                Изтрий избраните
                            </button>
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="btn btn-ghost btn-sm rounded-2xl gap-2"
                            >
                                <Download size={16} />
                                CSV / Excel
                            </button>
                            <button
                                type="button"
                                onClick={exportBackupJson}
                                className="btn btn-ghost btn-sm rounded-2xl gap-2"
                            >
                                <Download size={16} />
                                Backup JSON
                            </button>
                            <button
                                type="button"
                                onClick={() => loadData({ useCache: false })}
                                className="btn btn-ghost btn-sm rounded-2xl gap-2"
                            >
                                <RefreshCw size={16} />
                                Обнови
                            </button>
                        </div>
                    </div>

                    <div className="bg-base-200/60 rounded-3xl border border-base-content/5 p-4 md:p-5 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="opacity-60" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="input input-sm bg-base-100 rounded-2xl w-60 max-w-full text-sm"
                                    placeholder="Търси по всички полета..."
                                />
                            </div>
                            <div className="text-xs opacity-60 font-medium">
                                Показани {dataPage.items.length} от {dataPage.total} записи
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-base-content/5 bg-base-100">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-xs"
                                                checked={
                                                    selection.length ===
                                                        dataPage.items.length &&
                                                    dataPage.items.length > 0
                                                }
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        {activeTable?.fields.map((f) => (
                                            <th key={f.id} className="text-xs font-bold">
                                                {f.label}
                                            </th>
                                        ))}
                                        <th className="text-xs font-bold text-right">
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataPage.items.map((row) => (
                                        <tr key={row[activeTable.primaryKey]}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-xs"
                                                    checked={selection.includes(
                                                        row[activeTable.primaryKey]
                                                    )}
                                                    onChange={() =>
                                                        toggleSelection(row[activeTable.primaryKey])
                                                    }
                                                />
                                            </td>
                                            {activeTable.fields.map((f) => (
                                                <td key={f.id} className="text-xs">
                                                    {f.type === "json"
                                                        ? JSON.stringify(row[f.id] || "")
                                                        : row[f.id]}
                                                </td>
                                            ))}
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-xs rounded-full gap-1"
                                                    onClick={() => openEdit(row)}
                                                >
                                                    <Edit2 size={14} />
                                                    Редакция
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!dataPage.items.length && (
                                        <tr>
                                            <td
                                                colSpan={
                                                    (activeTable?.fields.length || 0) + 2
                                                }
                                                className="text-center py-6 text-xs opacity-60"
                                            >
                                                Няма записи за показване.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <div className="text-xs opacity-60">
                                Страница {dataPage.page + 1} от {dataPage.pages || 1}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={dataPage.page === 0}
                                    onClick={() => loadData({ page: dataPage.page - 1 })}
                                    className="btn btn-xs rounded-full"
                                >
                                    Предишна
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        dataPage.page + 1 >= dataPage.pages ||
                                        dataPage.pages === 0
                                    }
                                    onClick={() => loadData({ page: dataPage.page + 1 })}
                                    className="btn btn-xs rounded-full"
                                >
                                    Следваща
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTable && (
                        <form
                            onSubmit={handleSubmit}
                            className="bg-base-200/60 rounded-3xl border border-base-content/5 p-5 md:p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center">
                                        <Database size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black">
                                            {editingRow ? "Редакция на запис" : "Нов запис"}
                                        </h3>
                                        <p className="text-xs opacity-60">
                                            Задължителните полета са отбелязани.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeTable.fields.map((field) => (
                                    <div key={field.id} className="form-control">
                                        <label className="label">
                                            <span className="label-text text-xs font-bold uppercase tracking-wide opacity-70">
                                                {field.label}
                                                {field.required && (
                                                    <span className="text-error ml-1">*</span>
                                                )}
                                            </span>
                                        </label>
                                        {field.type === "json" ? (
                                            <textarea
                                                className="textarea textarea-sm bg-base-100 rounded-2xl font-mono text-xs"
                                                rows={4}
                                                value={formValues[field.id] || ""}
                                                onChange={(e) =>
                                                    handleFormChange(field.id, e.target.value)
                                                }
                                            />
                                        ) : field.type === "boolean" ? (
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary"
                                                checked={!!formValues[field.id]}
                                                onChange={(e) =>
                                                    handleFormChange(field.id, e.target.checked)
                                                }
                                            />
                                        ) : field.type === "select" ? (
                                            <select
                                                className="select select-sm bg-base-100 rounded-2xl"
                                                required={field.required}
                                                value={formValues[field.id] || ""}
                                                onChange={(e) =>
                                                    handleFormChange(field.id, e.target.value)
                                                }
                                            >
                                                <option value="">Изберете...</option>
                                                {(field.options || []).map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type || "text"}
                                                step={field.step}
                                                required={field.required}
                                                className="input input-sm bg-base-100 rounded-2xl"
                                                value={formValues[field.id] || ""}
                                                onChange={(e) =>
                                                    handleFormChange(field.id, e.target.value)
                                                }
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-2xl font-black gap-2"
                                    disabled={loading}
                                >
                                    <PlusCircle size={16} />
                                    {editingRow ? "Запази промените" : "Създай запис"}
                                </button>
                                {status.msg && (
                                    <div
                                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-2xl ${
                                            status.type === "success"
                                                ? "bg-success/10 text-success"
                                                : status.type === "error"
                                                ? "bg-error/10 text-error"
                                                : "bg-base-200 text-base-content"
                                        }`}
                                    >
                                        {status.type === "success" && (
                                            <CheckCircle size={14} />
                                        )}
                                        {status.type === "error" && (
                                            <AlertCircle size={14} />
                                        )}
                                        <span>{status.msg}</span>
                                    </div>
                                )}
                            </div>
                        </form>
                    )}

                    {loading && (
                        <div className="toast toast-end">
                            <div className="alert alert-info text-xs">
                                Зареждане...
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
