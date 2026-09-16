import { describe, it, expect } from 'vitest';
import { nextHistoryPoints, mergeCalculatorHistory, historyPoints } from '@/lib/calcHistory';

const HOUR = 60 * 60 * 1000;
const UNI = 'Софийски университет';

describe('nextHistoryPoints', () => {
    it('първо изчисление създава една точка', () => {
        expect(nextHistoryPoints(undefined, 20, UNI, 1000)).toEqual([{ score: 20, date: 1000, university: UNI }]);
    });

    it('връща същия масив, когато балът не е променен (без безкраен render)', () => {
        const existing = { points: [{ score: 20, date: 0, university: UNI }] };
        expect(nextHistoryPoints(existing, 20, UNI, 5 * HOUR)).toBe(existing.points);
    });

    it('в рамките на 30 минути замества последната точка (междинни оценки при писане)', () => {
        const existing = { points: [{ score: 18, date: 0, university: UNI }, { score: 20, date: 10 * HOUR, university: UNI }] };
        const next = nextHistoryPoints(existing, 22, UNI, 10 * HOUR + 60 * 1000);
        expect(next.map((p) => p.score)).toEqual([18, 22]);
    });

    it('след повече от 30 минути добавя нова точка', () => {
        const existing = { points: [{ score: 20, date: 0, university: UNI }] };
        expect(nextHistoryPoints(existing, 22, UNI, 2 * HOUR).map((p) => p.score)).toEqual([20, 22]);
    });

    it('смяна на университета започва поредицата отначало', () => {
        const existing = { points: [{ score: 20, date: 0, university: UNI }] };
        expect(nextHistoryPoints(existing, 25, 'УНСС', 2 * HOUR)).toEqual([{ score: 25, date: 2 * HOUR, university: 'УНСС' }]);
    });

    it('пази най-много 8 точки', () => {
        let entry;
        for (let i = 0; i < 12; i++) entry = { points: nextHistoryPoints(entry, i + 1, UNI, i * HOUR) };
        expect(entry.points).toHaveLength(8);
        expect(entry.points[7].score).toBe(12);
    });

    it('стар запис без точки се чете като една точка', () => {
        expect(historyPoints({ score: 15, date: 7, university: UNI })).toEqual([{ score: 15, date: 7, university: UNI }]);
    });
});

describe('mergeCalculatorHistory', () => {
    it('пази по-новия запис за специалност и подрежда по дата', () => {
        const account = [{ faculty: 'Ф', specialty: 'Право', score: 20, date: 1 }];
        const local = [
            { faculty: 'Ф', specialty: 'Право', score: 22, date: 5 },
            { faculty: 'Ф', specialty: 'Икономика', score: 18, date: 3 },
        ];
        const merged = mergeCalculatorHistory(account, local);
        expect(merged.map((h) => [h.specialty, h.score])).toEqual([['Право', 22], ['Икономика', 18]]);
    });
});
