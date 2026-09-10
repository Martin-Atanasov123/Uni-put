// Хук: useNextDeadline
// Намира най-близкия предстоящ срок за кандидатстване от admission_events.
// CLAUDE.md §11: „In calculator result, if deadline is within 30 days" —
// показва фактическа спешност, не фалшива недостига.
//
// useNextDeadline(universityName)  → срок само за този университет (или null)
// useNextDeadline()                → най-близкият срок изобщо (за season banner)
//
// Връща: null | { universityName, title, deadline: 'YYYY-MM-DD', daysLeft, sourceUrl, type }

import { useEffect, useState } from 'react';
import { calendarService } from '@/services/calendarService';

let _cache = null;      // Promise<events[]> — споделя fetch между всички инстанции
function loadEvents() {
    if (!_cache) _cache = calendarService.getAdmissionEvents();
    return _cache;
}

function daysUntil(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const target = new Date(y, m - 1, d).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86_400_000);
}

export function useNextDeadline(universityName = null) {
    const [deadline, setDeadline] = useState(null);

    useEffect(() => {
        let alive = true;
        loadEvents().then((events) => {
            if (!alive) return;
            const candidates = (events || [])
                .filter((e) => e.event_type === 'application' || e.event_type === 'exam')
                .filter((e) => !universityName || e.university_name === universityName)
                .map((e) => {
                    const iso = e.end_date || e.start_date;
                    return {
                        universityName: e.university_name,
                        title: e.title,
                        deadline: iso,
                        daysLeft: daysUntil(iso),
                        sourceUrl: e.source_url || null,
                        type: e.event_type,
                    };
                })
                .filter((e) => e.daysLeft >= 0)
                // срок за кандидатстване бие изпит при равни дни; после по-близкото
                .sort((a, b) =>
                    a.daysLeft - b.daysLeft ||
                    (a.type === 'application' ? -1 : 1) - (b.type === 'application' ? -1 : 1),
                );
            setDeadline(candidates[0] || null);
        });
        return () => { alive = false; };
    }, [universityName]);

    return deadline;
}
