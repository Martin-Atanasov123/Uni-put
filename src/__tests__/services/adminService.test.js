import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "@/services/adminService";
import { supabase } from "@/lib/supabase";

vi.mock("@/components/admin/adminConfig", () => ({
  ADMIN_TABLES: [{
    table: "test_table",
    searchFields: ["name", "city"],
    defaultSort: { field: "name", direction: "asc" },
  }],
}));

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

const listBuilder = (result) => {
  const builder = {
    select: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn().mockResolvedValue(result),
  };
  return builder;
};

describe("adminService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads only the requested server-side page with an exact count", async () => {
    const builder = listBuilder({ data: [{ id: 11, name: "Row 11" }], count: 21, error: null });
    supabase.from.mockReturnValue(builder);

    const page = await adminService.list("test_table", { page: 1 });

    expect(builder.select).toHaveBeenCalledWith("*", { count: "exact" });
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true });
    // второ подреждане по ключа: имената се повтарят и без него страниците се разминават
    expect(builder.order).toHaveBeenLastCalledWith("id", { ascending: true });
    expect(builder.range).toHaveBeenCalledWith(10, 19);
    expect(page).toMatchObject({ page: 1, pageSize: 10, total: 21, pages: 3 });
    expect(page.items).toHaveLength(1);
  });

  it("applies sanitized text search on configured database columns", async () => {
    const builder = listBuilder({ data: [], count: 0, error: null });
    supabase.from.mockReturnValue(builder);

    await adminService.list("test_table", { filters: { query: "  София,%_  " } });

    expect(builder.or).toHaveBeenCalledWith("name.ilike.%София%,city.ilike.%София%");
  });

  it("creates a row", async () => {
    const created = { id: 10, name: "Created" };
    const select = vi.fn().mockResolvedValue({ data: [created], error: null });
    const insert = vi.fn(() => ({ select }));
    supabase.from.mockReturnValue({ insert });

    await expect(adminService.create("test_table", { name: "Created" })).resolves.toEqual(created);
  });

  it("removes only the requested ids", async () => {
    const inFn = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn(() => ({ in: inFn }));
    supabase.from.mockReturnValue({ delete: deleteFn });

    await adminService.removeMany("test_table", "id", [1, 2, 3]);
    expect(inFn).toHaveBeenCalledWith("id", [1, 2, 3]);
  });

  it("exports in bounded batches instead of a single oversized request", async () => {
    const first = Array.from({ length: 1000 }, (_, id) => ({ id }));
    const builders = [
      listBuilder({ data: first, error: null }),
      listBuilder({ data: [{ id: 1000 }], error: null }),
    ];
    supabase.from.mockImplementation(() => builders.shift());

    const rows = await adminService.exportAll("test_table");
    expect(rows).toHaveLength(1001);
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});
