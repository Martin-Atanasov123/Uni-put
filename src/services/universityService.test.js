// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { universityService } from './universityService';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn()
    }
}));

// Mock LocalStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: function(key) {
            return store[key] || null;
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        removeItem: function(key) {
            delete store[key];
        },
        clear: function() {
            store = {};
        }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('UniversityService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should fetch universities_duplicate from API if cache is empty', async () => {
        const mockData = [
            { id: 1, university_name: 'Uni 1', specialty: 'CS', city: 'Sofia' },
            { id: 2, university_name: 'Uni 2', specialty: 'Math', city: 'Plovdiv' }
        ];

        supabase.from.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockData, error: null })
        });

        const result = await universityService.searchUniversities({});
        
        expect(supabase.from).toHaveBeenCalledWith('universities_duplicate');
        expect(result).toHaveLength(2);
        expect(result[0].university_name).toBe('Uni 1');
    });

    it('should return cached data if valid', async () => {
        const mockData = [{ id: 1, university_name: 'Cached Uni', specialty: 'CS', city: 'Sofia' }];
        const cacheEntry = {
            timestamp: Date.now(),
            data: mockData
        };
        localStorage.setItem('universities_cache', JSON.stringify(cacheEntry));

        // Ensure supabase is NOT called
        const result = await universityService.searchUniversities({});
        
        expect(supabase.from).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0].university_name).toBe('Cached Uni');
    });

    it('should filter results by query', async () => {
        const mockData = [
            { id: 1, university_name: 'Technical University', specialty: 'Computer Science', city: 'Sofia' },
            { id: 2, university_name: 'Medical University', specialty: 'Medicine', city: 'Varna' }
        ];

        supabase.from.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockData, error: null })
        });

        const result = await universityService.searchUniversities({ query: 'Technical' });
        expect(result).toHaveLength(1);
        expect(result[0].university_name).toBe('Technical University');
    });

    it('should match specialty by synonym when query is "право"', async () => {
        const mockData = [
            { id: 1, university_name: 'SU', specialty: 'Юридически науки', city: 'Sofia' },
            { id: 2, university_name: 'UNWE', specialty: 'Правни науки', city: 'Sofia' },
            { id: 3, university_name: 'TU', specialty: 'Computer Science', city: 'Sofia' }
        ];

        supabase.from.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockData, error: null })
        });

        const result = await universityService.searchUniversities({ query: 'право' });
        expect(result).toHaveLength(2);
        const specs = result.map(r => r.specialty).sort();
        expect(specs).toEqual(['Правни науки', 'Юридически науки'].sort());
    });

    it('should return fresh fetch fallback when cache misses "право"', async () => {
        const cachedEntry = {
            timestamp: Date.now(),
            data: [
                { id: 10, university_name: 'Cached Uni', specialty: 'Biology', city: 'Varna' }
            ]
        };
        localStorage.setItem('universities_cache', JSON.stringify(cachedEntry));

        const freshData = [
            { id: 20, university_name: 'SU', specialty: 'Право', city: 'Sofia' }
        ];

        supabase.from.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: freshData, error: null })
        });

        const result = await universityService.searchUniversities({ query: 'право' });
        expect(result).toHaveLength(1);
        expect(result[0].specialty.toLowerCase()).toContain('право');
    });
    it('should filter results by city', async () => {
        const mockData = [
            { id: 1, university_name: 'Uni 1', specialty: 'CS', city: 'Sofia' },
            { id: 2, university_name: 'Uni 2', specialty: 'Math', city: 'Plovdiv' }
        ];

        supabase.from.mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockData, error: null })
        });

        const result = await universityService.searchUniversities({ city: 'Sofia' });
        expect(result).toHaveLength(1);
        expect(result[0].city).toBe('Sofia');
    });
});
