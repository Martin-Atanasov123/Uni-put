// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { universityService } from '@/services/universityService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() }
}));

// Mock LocalStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/**
 * Помощна функция: създава chainable mock на Supabase query builder.
 * Записва извикваните методи в `calls`, така че тестовете да валидират
 * че сме приложили server-side .ilike()/.or()/.eq()/.range().
 */
function makeQueryMock({ resolveData = [], resolveError = null } = {}) {
    const calls = { or: [], eq: [], range: [], order: [], in: [], select: [] };
    const builder = {
        select: vi.fn(function (cols) { calls.select.push(cols); return this; }),
        or:     vi.fn(function (s)    { calls.or.push(s);     return this; }),
        eq:     vi.fn(function (c, v) { calls.eq.push([c, v]); return this; }),
        in:     vi.fn(function (c, v) { calls.in.push([c, v]); return this; }),
        order:  vi.fn(function (c, o) { calls.order.push([c, o]); return this; }),
        range:  vi.fn(function (a, b) {
            calls.range.push([a, b]);
            return Promise.resolve({ data: resolveData, error: resolveError });
        }),
        // За getCities / getByIds които не извикват range() — финалният .select връща Promise.
        // За тази цел връщаме thenable след .select() ако чейнът свършва там.
    };
    // Make the builder thenable-able for queries that end after .in()/.select()
    builder.then = (resolve) => resolve({ data: resolveData, error: resolveError });
    return { builder, calls };
}

describe('universityService.searchUniversities (server-side)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('прилага .range() на сървъра и връща резултата', async () => {
        const data = [{ id: 1, university_name: 'СУ', specialty: 'Информатика' }];
        const { builder, calls } = makeQueryMock({ resolveData: data });
        supabase.from.mockReturnValue(builder);

        const result = await universityService.searchUniversities({});

        expect(supabase.from).toHaveBeenCalledWith('universities');
        expect(calls.range.length).toBe(1);
        expect(calls.range[0][0]).toBe(0);
        expect(result).toHaveLength(1);
    });

    it('изпраща .or() с ilike патърни когато има query', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ query: 'Технически' });

        expect(calls.or.length).toBe(1);
        const orStr = calls.or[0];
        // Query се нормализира до lowercase преди да се вгради в pattern (ilike е case-insensitive)
        expect(orStr).toContain('specialty.ilike.%технически%');
        expect(orStr).toContain('university_name.ilike.%технически%');
        expect(orStr).toContain('faculty.ilike.%технически%');
    });

    it('разширява "право" със синонимите ("юридически науки", "правни науки")', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ query: 'право' });

        const orStr = calls.or[0];
        expect(orStr).toContain('право');
        expect(orStr).toContain('юридически науки');
        expect(orStr).toContain('правни науки');
    });

    it('прилага .eq() за град когато не е "Всички"', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ city: 'София' });

        expect(calls.eq).toEqual(expect.arrayContaining([['city', 'София']]));
    });

    it('прилага .eq() за education_level когато не е "Всички"', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ level: 'бакалавър' });

        expect(calls.eq).toEqual(expect.arrayContaining([['education_level', 'бакалавър']]));
    });

    it('НЕ прилага .eq() когато филтърът е "Всички"', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ city: 'Всички', level: 'Всички' });

        expect(calls.eq.length).toBe(0);
    });

    it('почиства user input от метасимволи преди .ilike()', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        // Опасни символи: %, _ (SQL wildcards), запетая (PostgREST .or() separator),
        // кавички, скоби, наклонена черта.
        await universityService.searchUniversities({ query: "test%_',()\\" });

        const orStr = calls.or[0];
        // Pattern-ите които ние добавяме ('%test%') са OK, но user-provided метасимволи
        // вътре в текста трябва да са изчистени:
        expect(orStr).toContain('%test%');
        expect(orStr).not.toContain("'");
        expect(orStr).not.toContain('(');
        expect(orStr).not.toContain('\\');
        // Никакви вътрешни % или _ от user input — само нашите wrapper-и
        // (3 wrapper-а × 2 % = 6 общо в string-а, нито един друг)
        expect((orStr.match(/%/g) || []).length).toBe(6);
    });

    it('хвърля грешка нагоре (за UI error handling)', async () => {
        const { builder } = makeQueryMock({ resolveError: { message: 'network down' } });
        supabase.from.mockReturnValue(builder);

        await expect(universityService.searchUniversities({})).rejects.toMatchObject({ message: 'network down' });
    });
});

describe('universityService.getByIds', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('връща празен масив за празен input', async () => {
        const result = await universityService.getByIds([]);
        expect(result).toEqual([]);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('прилага .in() с числови ID-та', async () => {
        const data = [{ id: 5, university_name: 'X' }];
        const { builder, calls } = makeQueryMock({ resolveData: data });
        supabase.from.mockReturnValue(builder);

        const result = await universityService.getByIds(['5', '7', 'invalid']);

        expect(calls.in.length).toBe(1);
        expect(calls.in[0][0]).toBe('id');
        expect(calls.in[0][1]).toEqual([5, 7]);
        expect(result).toEqual(data);
    });
});

describe('universityService.getCities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('дърпа само колоната "city" и кешира', async () => {
        const data = [
            { city: 'София' }, { city: 'Пловдив' }, { city: 'София' }, { city: null }
        ];
        const { builder, calls } = makeQueryMock({ resolveData: data });
        supabase.from.mockReturnValue(builder);

        const result = await universityService.getCities();

        expect(calls.select).toContain('city');
        expect(result[0]).toBe('Всички');
        expect(result).toContain('София');
        expect(result).toContain('Пловдив');
        // Без дубликати, без null
        expect(result.filter(c => c === 'София').length).toBe(1);
        // Запазено в localStorage
        expect(localStorage.getItem('uniput_cities_cache_v1')).toBeTruthy();
    });

    it('връща кеширания списък без втора заявка', async () => {
        localStorage.setItem('uniput_cities_cache_v1', JSON.stringify({
            ts: Date.now(),
            data: ['Всички', 'Бургас']
        }));

        const result = await universityService.getCities();

        expect(supabase.from).not.toHaveBeenCalled();
        expect(result).toEqual(['Всички', 'Бургас']);
    });
});
