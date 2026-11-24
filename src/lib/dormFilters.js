// Филтри и подредба за общежитията — чиста логика, без React.
// Филтрираме само по полета, които са попълнени за всички записи:
// град, университет и разстояние. Наемът е попълнен рядко → само подредба,
// като общежитията без посочен наем отиват последни (не се скриват).

export const DISTANCE_OPTIONS = [
    { value: "", label: "Всички" },
    { value: "1", label: "до 1 км" },
    { value: "3", label: "до 3 км" },
];
export const SORT_OPTIONS = [
    { value: "", label: "Подразбиране" },
    { value: "rent", label: "По наем" },
];

const MAX_PARAM = 120;
const clean = v => String(v ?? "").slice(0, MAX_PARAM).trim();

// Стойности от адреса се приемат само ако съществуват в данните.
export function readFilters(params, dorms) {
    const cities = new Set(dorms.map(d => d.city).filter(Boolean));
    const unis = new Set(dorms.map(d => d.university_id).filter(Boolean));
    const city = clean(params.get("city"));
    const uni = clean(params.get("uni"));
    const km = clean(params.get("km"));
    const sort = clean(params.get("sort"));
    return {
        city: cities.has(city) ? city : "",
        uni: unis.has(uni) ? uni : "",
        km: DISTANCE_OPTIONS.some(o => o.value === km) ? km : "",
        sort: SORT_OPTIONS.some(o => o.value === sort) ? sort : "",
    };
}

export function writeFilters(f) {
    const p = new URLSearchParams();
    for (const k of ["city", "uni", "km", "sort"]) if (f[k]) p.set(k, f[k]);
    return p;
}

export const hasRent = d => Number(d.monthly_rent_avg) > 0;

export function citiesOf(dorms) {
    return [...new Set(dorms.map(d => d.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bg"));
}

// Университетите в избрания град (или всички).
export function universitiesOf(dorms, city) {
    return [...new Set(dorms.filter(d => !city || d.city === city).map(d => d.university_id).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "bg"));
}

export function applyFilters(dorms, { city = "", uni = "", km = "", sort = "" } = {}) {
    const max = km ? Number(km) : null;
    const out = dorms.filter(d =>
        (!city || d.city === city) &&
        (!uni || d.university_id === uni) &&
        (max === null || (d.distance_to_uni_km != null && Number(d.distance_to_uni_km) <= max))
    );
    if (sort === "rent") {
        // стабилна подредба: с наем по възходящ ред, без наем — последни в досегашния ред
        return out
            .map((d, i) => ({ d, i }))
            .sort((a, b) => {
                const ra = hasRent(a.d), rb = hasRent(b.d);
                if (ra !== rb) return ra ? -1 : 1;
                if (ra && rb && a.d.monthly_rent_avg !== b.d.monthly_rent_avg) return a.d.monthly_rent_avg - b.d.monthly_rent_avg;
                return a.i - b.i;
            })
            .map(x => x.d);
    }
    return out;
}

export const activeCount = f => ["city", "uni", "km"].filter(k => f[k]).length;
