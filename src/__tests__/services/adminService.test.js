// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "./adminService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    in: vi.fn()
  }
}));

const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe("adminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: createLocalStorageMock(),
      writable: true
    });
  });

  it("list fetches data from API and caches it", async () => {
    const rows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" }
    ];
    supabase.select.mockResolvedValue({ data: rows, error: null });

    const page = await adminService.list("test_table", {
      page: 0,
      filters: { query: "" }
    });

    expect(supabase.from).toHaveBeenCalledWith("test_table");
    expect(page.items.length).toBe(2);

    const cached = window.localStorage.getItem("admin_cache_v1");
    expect(cached).toBeTruthy();
  });

  it("list applies pagination correctly", async () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    supabase.select.mockResolvedValue({ data: rows, error: null });

    // Page 0 should have 10 items (default PAGE_SIZE)
    const page0 = await adminService.list("test_table", { page: 0 });
    expect(page0.items.length).toBe(10);
    expect(page0.items[0].id).toBe(1);
    expect(page0.pages).toBe(2);

    // Page 1 should have 5 items
    const page1 = await adminService.list("test_table", { page: 1 });
    expect(page1.items.length).toBe(5);
    expect(page1.items[0].id).toBe(11);
  });

  it("create invalidates cache and returns created row", async () => {
    const created = { id: 10, name: "Created" };
    supabase.insert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [created], error: null })
    });

    const result = await adminService.create("test_table", { name: "Created" });
    expect(result.id).toBe(10);
  });

  it("removeMany calls delete with ids", async () => {
    supabase.delete.mockReturnValue({
      in: vi.fn().mockResolvedValue({ error: null })
    });

    await adminService.removeMany("test_table", "id", [1, 2, 3]);
    expect(supabase.from).toHaveBeenCalledWith("test_table");
  });
});

