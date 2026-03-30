// Модул: Административен сервиз (CRUD/кеш/експорт)
// Описание: Предоставя унифицирани операции върху таблици в Supabase за админ панела,
//   включително кеширане в localStorage, филтриране, странициране и експорт.
// Вход: имена на таблици, payload обекти, опции за филтри и странициране
// Изход: страницирани резултати, създадени/обновени записи или масиви от записи за експорт
// Бележки: При промени кешът се инвалидира за съответната таблица; грешките се хвърлят към UI.
//
// Основни функции:
// - list(table, options): Чете всички записи, прилага текстов филтър и странициране.
// - create(table, payload): Създава нов запис и инвалидира кеша.
// - update(table, idField, id, payload): Обновява запис по идентификатор и инвалидира кеша.
// - removeMany(table, idField, ids): Масово изтриване на записи по списък от идентификатори.
// - exportAll(table): Връща всички записи за експорт (CSV/JSON).
//
// Вход/Изход:
// - table: низ с име на таблица в Supabase.
// - options: { useCache?: boolean, page?: number, filters?: { query?: string } }
// - payload: обект със стойности за insert/update.
// - idField / id / ids: поле за идентификатор, стойност на идентификатор, списък от идентификатори.
//
// Edge случаи и бележки:
// - Ако Supabase върне грешка, тя се хвърля (throw), за да може UI да визуализира статуса.
// - Кешът се държи в localStorage; при обновяване/изтриване се инвалидира за съответната таблица.
// - Филтърът е прост, пълнотекстов (join на всички стойности), който е достатъчен за малък обем данни.
import { supabase } from "../lib/supabase";
import { ADMIN_TABLES } from "../admin/adminConfig";

const CACHE_KEY = "admin_cache_v1";
const PAGE_SIZE = 10;
const ALLOWED_TABLES = ADMIN_TABLES.map(t => t.table);

const assertAllowedTable = (table) => {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Невалидна таблица.");
  }
};

// Прочитане на кеш обекта от localStorage.
// Връща: {} ако няма валиден кеш.
const getCache = () => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const setCache = (cache) => {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    return;
  }
};

// Инвалидиране на кеша за конкретна таблица.
const invalidateTableCache = (table) => {
  const cache = getCache();
  delete cache[table];
  setCache(cache);
};

// Четене на записите от кеш за конкретна таблица.
const readFromCache = (table) => {
  const cache = getCache();
  return cache[table] || null;
};

// Записване на резултатите в кеш за конкретна таблица.
const writeToCache = (table, rows) => {
  const cache = getCache();
  cache[table] = {
    timestamp: Date.now(),
    data: rows
  };
  setCache(cache);
};

// Прилагане на текстови филтри върху резултатите.
// filters.query: прост пълнотекстов филтър върху всички стойности.
const applyFilters = (rows, filters) => {
  if (!filters) return rows;
  const { query } = filters;
  if (!query) return rows;
  const lower = query.toLowerCase();
  return rows.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(lower)
  );
};

const paginate = (rows, page) => {
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return {
    page,
    pageSize: PAGE_SIZE,
    total: rows.length,
    pages: Math.ceil(rows.length / PAGE_SIZE),
    items: rows.slice(start, end)
  };
};

export const adminService = {
  /**
   * Списък записи със странициране и филтри
   * @param {string} table - Таблица в Supabase
   * @param {{ useCache?: boolean, page?: number, filters?: { query?: string } }} options
   * @returns {{ page: number, pageSize: number, total: number, pages: number, items: any[] }}
   */
  async list(table, options = {}) {
    assertAllowedTable(table);
    const { useCache = true, page = 0, filters } = options;
    let rows = [];

    if (useCache) {
      const cached = readFromCache(table);
      if (cached) {
        rows = cached.data;
      }
    }

    if (!rows.length) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        throw error;
      }
      rows = data || [];
      writeToCache(table, rows);
    }

    const filtered = applyFilters(rows, filters);
    return paginate(filtered, page);
  },

  /**
   * Създаване на нов запис
   * @param {string} table - Таблица в Supabase
   * @param {object} payload - Данни за вмъкване
   * @returns {object|null} - Създаденият запис (ако Supabase го върне), иначе null
   */
  async create(table, payload) {
    assertAllowedTable(table);
    const { data, error } = await supabase.from(table).insert([payload]).select();
    if (error) throw error;
    invalidateTableCache(table);
    return data && data[0] ? data[0] : null;
  },

  /**
   * Обновяване на запис по идентификатор
   * @param {string} table - Таблица в Supabase
   * @param {string} idField - Име на идентификаторното поле
   * @param {string|number} id - Стойност на идентификатора
   * @param {object} payload - Данни за обновяване
   * @returns {object|null} - Обновеният запис (ако Supabase го върне), иначе null
   */
  async update(table, idField, id, payload) {
    assertAllowedTable(table);
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq(idField, id)
      .select();
    if (error) throw error;
    invalidateTableCache(table);
    return data && data[0] ? data[0] : null;
  },

  /**
   * Масово изтриване на записи
   * @param {string} table - Таблица в Supabase
   * @param {string} idField - Име на идентификаторното поле
   * @param {Array<string|number>} ids - Списък от идентификатори
   */
  async removeMany(table, idField, ids) {
    assertAllowedTable(table);
    const { error } = await supabase.from(table).delete().in(idField, ids);
    if (error) throw error;
    invalidateTableCache(table);
  },

  /**
   * Експорт на всички записи (за CSV/JSON/backup)
   * @param {string} table - Таблица в Supabase
   * @returns {Array<object>} - Списък от всички записи
   */
  async exportAll(table) {
    assertAllowedTable(table);
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return data || [];
  }
};
