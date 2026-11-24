import { useEffect, useState } from "react";

// true под 768px. Без window (тестове, пререндер) — false, т.е. настолният изглед.
const QUERY = "(max-width: 767px)";

export function useIsMobile() {
    const [mobile, setMobile] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(QUERY).matches);
    useEffect(() => {
        const mq = window.matchMedia?.(QUERY);
        if (!mq) return;
        const on = () => setMobile(mq.matches);
        on();
        mq.addEventListener?.("change", on);
        return () => mq.removeEventListener?.("change", on);
    }, []);
    return mobile;
}
