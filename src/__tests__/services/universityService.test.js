// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { universityService } from '@/services/universityService';
import { supabase } from '@/lib/supabase';

import { ADMISSION_YEAR } from '@/lib/siteStats';

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
        // Lowercase + дълги думи без последните 2 букви, за да хващат и други форми
        expect(orStr).toContain('specialty.ilike.%техничес%');
        expect(orStr).toContain('university_name.ilike.%техничес%');
        expect(orStr).toContain('faculty.ilike.%техничес%');
        expect(orStr).toContain('city.ilike.%техничес%');
    });

    it('всяка дума е отделно .or() условие (AND между думите)', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ query: 'информатика в София' });

        expect(calls.or.length).toBe(2);
        expect(calls.or[0]).toContain('specialty.ilike.%информати%');
        expect(calls.or[1]).toContain('city.ilike.%софия%');
    });

    it('разпознава съкращение на университет като цяла дума', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ query: 'УНСС' });

        expect(calls.or).toEqual(['university_name.ilike.Университет за национално и световно стопанство%']);
    });

    it('търси латиница и като кирилица, и синоними', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ query: 'informatika стоматология' });

        expect(calls.or[0]).toContain('%информати%');
        expect(calls.or[1]).toContain('%дентална медицина%');
    });

    it('подрежда първо програмите със съвпадение в името на специалността', async () => {
        const data = [
            { id: 'a', specialty: 'Химия', university_name: 'Софийски университет', faculty: 'Информатика' },
            { id: 'b', specialty: 'Бизнес информатика', university_name: 'УНСС', faculty: 'Икономика' },
            { id: 'c', specialty: 'Информатика', university_name: 'ПУ', faculty: 'Математика' },
        ];
        const { builder } = makeQueryMock({ resolveData: data });
        supabase.from.mockReturnValue(builder);

        const result = await universityService.searchUniversities({ query: 'информатика' });

        expect(result.map((r) => r.id)).toEqual(['c', 'b', 'a']);
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

    it('НЕ прилага .eq() за град/ниво когато филтърът е "Всички"', async () => {
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ city: 'Всички', level: 'Всички' });

        const columns = calls.eq.map(([column]) => column);
        expect(columns).not.toContain('city');
        expect(columns).not.toContain('education_level');
    });

    it('ВИНАГИ филтрира по academic_year, дори без други филтри', async () => {
        // Без този филтър, при вкарване на прием 2027 всяка специалност щеше да
        // се появи по два пъти (веднъж за всяка година) във всички менюта.
        const { builder, calls } = makeQueryMock({ resolveData: [] });
        supabase.from.mockReturnValue(builder);

        await universityService.searchUniversities({ city: 'Всички', level: 'Всички' });

        expect(calls.eq).toEqual(
            expect.arrayContaining([['academic_year', ADMISSION_YEAR]])
        );
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
        // (2 варианта „test"/„тест" × 4 колони × 2 % = 16, нито един друг)
        expect((orStr.match(/%/g) || []).length).toBe(16);
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

    it('прилага .in() само с валидни UUID-та', async () => {
        const A = '11111111-1111-4111-8111-111111111111';
        const B = '22222222-2222-4222-8222-222222222222';
        const data = [{ id: A, university_name: 'X' }];
        const { builder, calls } = makeQueryMock({ resolveData: data });
        supabase.from.mockReturnValue(builder);

        const result = await universityService.getByIds([A, B, 'invalid', '5']);

        expect(calls.in.length).toBe(1);
        expect(calls.in[0][0]).toBe('id');
        expect(calls.in[0][1]).toEqual([A, B]);
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
