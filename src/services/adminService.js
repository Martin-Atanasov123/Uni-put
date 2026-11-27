// Административен CRUD сервиз. Списъците се филтрират и страницират в PostgreSQL;
// браузърът никога не изтегля цяла таблица само за да покаже една страница.
import { supabase } from "@/lib/supabase";
import { ADMIN_TABLES } from "@/components/admin/adminConfig";

const PAGE_SIZE = 10;
const EXPORT_BATCH_SIZE = 1000;
const TABLE_CONFIG = new Map(ADMIN_TABLES.map((config) => [config.table, config]));

const getConfig = (table) => {
  const config = TABLE_CONFIG.get(table);
  if (!config) throw new Error("Невалидна таблица.");
  return config;
};

const sanitizeSearch = (value) => String(value || "")
  .trim()
  .replace(/[%_\\,()'"]/g, "")
  .slice(0, 100);

// Подреждането по defaultSort (напр. university_name) не е уникално — без второ
// подреждане по първичния ключ редовете между две страници/партиди могат да се
// повторят или да изпаднат.
const applyStableOrder = (request, config) => {
  let ordered = request;
  if (config.defaultSort?.field) {
    ordered = ordered.order(config.defaultSort.field, {
      ascending: config.defaultSort.direction !== "desc",
    });
  }
  const pk = config.primaryKey || "id";
  if (pk !== config.defaultSort?.field) ordered = ordered.order(pk, { ascending: true });
  return ordered;
};

export const adminService = {
  async list(table, options = {}) {
    const config = getConfig(table);
    const page = Math.max(0, Number(options.page) || 0);
    const start = page * PAGE_SIZE;
    const queryText = sanitizeSearch(options.filters?.query);

    let request = supabase.from(table).select("*", { count: "exact" });
    if (queryText && config.searchFields?.length) {
      request = request.or(config.searchFields.map((field) => `${field}.ilike.%${queryText}%`).join(","));
    }
    request = applyStableOrder(request, config);

    const { data, error, count } = await request.range(start, start + PAGE_SIZE - 1);
    if (error) throw error;
    const total = count || 0;
    return { page, pageSize: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE), items: data || [] };
  },

  async create(table, payload) {
    getConfig(table);
    const { data, error } = await supabase.from(table).insert([payload]).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async update(table, idField, id, payload) {
    getConfig(table);
    const { data, error } = await supabase.from(table).update(payload).eq(idField, id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async removeMany(table, idField, ids) {
    getConfig(table);
    const { error } = await supabase.from(table).delete().in(idField, ids);
    if (error) throw error;
  },

  // Експортът по дефиниция обхожда всички записи, но на ограничени партиди.
  async exportAll(table) {
    const config = getConfig(table);
    const rows = [];
    for (let start = 0; ; start += EXPORT_BATCH_SIZE) {
      const request = applyStableOrder(supabase.from(table).select("*"), config);
      const { data, error } = await request.range(start, start + EXPORT_BATCH_SIZE - 1);
      if (error) throw error;
      const batch = data || [];
      rows.push(...batch);
      if (batch.length < EXPORT_BATCH_SIZE) break;
    }
    return rows;
  },
};
