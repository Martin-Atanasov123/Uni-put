// Централно хранилище за оценки на студента.
// Всички оценки се пазят на едно място и калкулаторът ги чете автоматично.
// GradeInputSection ги pre-fill-ва от тук, студентът може да override-ва per-specialty.

import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'uniput_my_grades_v1';

// ── Категории оценки за страницата "Моите оценки" ──────────────────────────
// Показваме само смислените полета, не всичките 150+ ключа.
export const GRADE_CATEGORIES = [
    {
        id: 'dzi',
        label: 'Матура (ДЗИ)',
        description: 'Оценки от държавните зрелостни изпити',
        color: 'var(--brand-cyan)',
        fields: [
            { key: 'dzi_bel',         label: 'БЕЛ (задължителен)' },
            { key: 'dzi_mat',         label: 'Математика' },
            { key: 'dzi_bio',         label: 'Биология' },
            { key: 'dzi_fiz',         label: 'Физика' },
            { key: 'dzi_him',         label: 'Химия' },
            { key: 'dzi_ist',         label: 'История' },
            { key: 'dzi_geo',         label: 'География' },
            { key: 'dzi_informatika', label: 'Информатика' },
            { key: 'dzi_it',          label: 'Информационни технологии' },
            { key: 'dzi_fil',         label: 'Философия' },
            { key: 'dzi_angliiski',   label: 'Английски език' },
            { key: 'dzi_nemski',      label: 'Немски език' },
            { key: 'dzi_frenski',     label: 'Френски език' },
            { key: 'dzi_ispanski',    label: 'Испански език' },
            { key: 'dzi_italianski',  label: 'Италиански език' },
            { key: 'dzi_ruski',       label: 'Руски език' },
            { key: 'dzi_chu_ezik',    label: 'Друг чужд език' },
            { key: 'dzi_muz',         label: 'Музика' },
            { key: 'dzi_ris',         label: 'Рисуване' },
        ],
    },
    {
        id: 'diploma',
        label: 'Диплома',
        description: 'Оценки от дипломата за средно образование',
        color: 'var(--brand-violet)',
        fields: [
            { key: 'obsht_uspeh',    label: 'Среден успех' },
            { key: 'diploma',        label: 'Общ успех диплома' },
            { key: 'diploma_bel',    label: 'БЕЛ (диплома)' },
            { key: 'diploma_mat',    label: 'Математика (диплома)' },
            { key: 'diploma_fiz',    label: 'Физика (диплома)' },
            { key: 'diploma_him',    label: 'Химия (диплома)' },
            { key: 'diploma_bio',    label: 'Биология (диплома)' },
            { key: 'diploma_geo',    label: 'География (диплома)' },
            { key: 'diploma_ist',    label: 'История (диплома)' },  // mapped from istoriq_diploma
            { key: 'angliiski_ezik', label: 'Английски (диплома)' },
            { key: 'chu_ezik',       label: 'Чужд език (диплома)' },
        ],
    },
    {
        id: 'exams',
        label: 'Кандидатстудентски изпити',
        description: 'Оценки от университетски приемни изпити',
        color: '#10b981',
        fields: [
            { key: 'exam_mat',        label: 'Математика (изпит)' },
            { key: 'exam_bel',        label: 'БЕЛ (изпит)' },
            { key: 'exam_bio',        label: 'Биология (изпит)' },
            { key: 'exam_fiz',        label: 'Физика (изпит)' },
            { key: 'exam_him',        label: 'Химия (изпит)' },
            { key: 'exam_ist',        label: 'История (изпит)' },
            { key: 'exam_geo',        label: 'География (изпит)' },
            { key: 'exam_informatika',label: 'Информатика (изпит)' },
            { key: 'exam_angliiski',  label: 'Английски (изпит)' },
            { key: 'exam_nemski',     label: 'Немски (изпит)' },
            { key: 'exam_frenski',    label: 'Френски (изпит)' },
            { key: 'exam_ispanski',   label: 'Испански (изпит)' },
            { key: 'exam_italianski', label: 'Италиански (изпит)' },
            { key: 'exam_ruski',      label: 'Руски (изпит)' },
            { key: 'exam_ris',        label: 'Рисуване (изпит)' },
            { key: 'exam_muz',        label: 'Музика (изпит)' },
            { key: 'exam_sport',      label: 'Физическа годност' },
            { key: 'exam_iq',         label: 'IQ тест' },
        ],
    },
    {
        id: 'other',
        label: 'Бонуси и друго',
        description: 'Олимпиади, сертификати, бонификации',
        color: '#FBBF24',
        fields: [
            { key: 'bonifikaciq',              label: 'Бонификация' },
            { key: 'olympiad_laureate_mat_inf', label: 'Олимпиада лауреат (Мат/Инф)' },
            { key: 'olympiad_winner_mat_inf',   label: 'Олимпиада победител (Мат/Инф)' },
            { key: 'olympiad_laureate_it',      label: 'Олимпиада лауреат (ИТ)' },
            { key: 'olympiad_winner_it',        label: 'Олимпиада победител (ИТ)' },
            { key: 'dzi_angliyski_b2',          label: 'Сертификат английски B2' },
            { key: 'dzi_chu_ezik_b2',           label: 'Сертификат чужд език B2' },
            { key: 'portfolio',                  label: 'Портфолио' },
        ],
    },
];

// Всички ключове от категориите — за бързо lookup
export const ALL_CATEGORY_KEYS = new Set(
    GRADE_CATEGORIES.flatMap(c => c.fields.map(f => f.key))
);

// ── Четене / записване ──────────────────────────────────────────────────────

export function loadGrades() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed.grades || {};
    } catch {
        return {};
    }
}

export function saveGrades(grades) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: 1,
            updatedAt: new Date().toISOString(),
            grades,
        }));
    } catch {
        // localStorage full — пропускаме без крит. грешка
    }
}

export function mergeGrade(key, value) {
    const current = loadGrades();
    const updated = { ...current, [key]: value };
    saveGrades(updated);
    return updated;
}

export function getUpdatedAt() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw).updatedAt || null;
    } catch {
        return null;
    }
}

// ── Supabase sync (само за влезли потребители) ──────────────────────────────

export async function syncToSupabase(grades) {
    try {
        await supabase.auth.updateUser({
            data: { my_grades: grades },
        });
    } catch {
        // Тихо fail — оценките са в localStorage, sync е bonus
    }
}

export async function loadFromSupabase() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.user_metadata?.my_grades || null;
    } catch {
        return null;
    }
}
