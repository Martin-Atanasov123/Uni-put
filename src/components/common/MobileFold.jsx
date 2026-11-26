import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

// Второстепенно съдържание: на телефон — свит раздел (<details>) със заглавие,
// на по-широк екран — показано както досега. Вътрешно заглавие, маркирано с
// data-fold-head, се скрива в свития вариант, за да не се повтаря.
export default function MobileFold({ title, meta, children, className = "", style, as: Tag = "div", open = false }) {
    const mobile = useIsMobile();
    if (!mobile) return <Tag className={className} style={style}>{children}</Tag>;
    return (
        <details className={`mfold ${className}`} style={style} open={open || undefined}>
            <summary className="mfold__sum">
                <span className="mfold__title">{title}</span>
                {meta != null && <span className="mfold__meta">{meta}</span>}
                <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className="mfold__chev" />
            </summary>
            <div className="mfold__body">{children}</div>
        </details>
    );
}
