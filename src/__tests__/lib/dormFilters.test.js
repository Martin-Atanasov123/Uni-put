import { describe, it, expect } from "vitest";
import { applyFilters, readFilters, writeFilters, universitiesOf, citiesOf, activeCount } from "@/lib/dormFilters";

const D = (id, city, uni, km, rent = null) => ({ id, city, university_id: uni, distance_to_uni_km: km, monthly_rent_avg: rent });
const DORMS = [
    D(1, "София", "СУ", 0.4, 80),
    D(2, "София", "ТУ", 2.5, null),
    D(3, "София", "СУ", 4.9, 60),
    D(4, "Варна", "ИУ", 2.1, 90),
    D(5, "Пловдив", "ПУ", 0.8, 0),
    D(6, "Варна", "ТУ-Варна", 0.2, null),
];

describe("applyFilters", () => {
    it("град, университет и разстояние", () => {
        expect(applyFilters(DORMS, { city: "София" }).map(d => d.id)).toEqual([1, 2, 3]);
        expect(applyFilters(DORMS, { city: "София", uni: "СУ" }).map(d => d.id)).toEqual([1, 3]);
        expect(applyFilters(DORMS, { km: "1" }).map(d => d.id)).toEqual([1, 5, 6]);
        expect(applyFilters(DORMS, { km: "3" }).map(d => d.id)).toEqual([1, 2, 4, 5, 6]);
    });

    it("подредба по наем: възходящо, без наем (null или 0) — последни, в досегашния ред", () => {
        expect(applyFilters(DORMS, { sort: "rent" }).map(d => d.id)).toEqual([3, 1, 4, 2, 5, 6]);
    });

    it("подредбата не скрива общежития без наем", () => {
        expect(applyFilters(DORMS, { sort: "rent" })).toHaveLength(DORMS.length);
    });

    it("не променя входния масив", () => {
        const copy = [...DORMS];
        applyFilters(DORMS, { sort: "rent" });
        expect(DORMS).toEqual(copy);
    });
});

describe("readFilters / writeFilters", () => {
    it("приема само стойности, които съществуват в данните", () => {
        const p = new URLSearchParams("city=София&uni=СУ&km=1&sort=rent");
        expect(readFilters(p, DORMS)).toEqual({ city: "София", uni: "СУ", km: "1", sort: "rent" });
        const bad = new URLSearchParams("city=Лондон&uni=x';drop&km=99&sort=evil");
        expect(readFilters(bad, DORMS)).toEqual({ city: "", uni: "", km: "", sort: "" });
    });

    it("записва само активните филтри", () => {
        expect(writeFilters({ city: "Варна", uni: "", km: "3", sort: "" }).toString()).toBe(new URLSearchParams({ city: "Варна", km: "3" }).toString());
    });
});

describe("списъци за избор", () => {
    it("градове и университети в града", () => {
        expect(citiesOf(DORMS)).toEqual(["Варна", "Пловдив", "София"]);
        expect(universitiesOf(DORMS, "Варна")).toEqual(["ИУ", "ТУ-Варна"]);
        expect(universitiesOf(DORMS, "")).toHaveLength(5);
    });

    it("брои активните филтри без подредбата", () => {
        expect(activeCount({ city: "София", uni: "", km: "1", sort: "rent" })).toBe(2);
    });
});
