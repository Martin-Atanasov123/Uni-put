import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Existing reports store a public URL. New reports store the bucket-relative path.
function screenshotPath(reference, userId) {
    let path = reference;
    if (/^https?:/i.test(reference)) {
        const url = new URL(reference);
        const prefix = "/storage/v1/object/public/reports-screenshots/";
        if (url.origin !== new URL(import.meta.env.VITE_SUPABASE_URL).origin || !url.pathname.startsWith(prefix)) return null;
        path = decodeURIComponent(url.pathname.slice(prefix.length));
    }
    const parts = path.split("/");
    if (parts.length !== 2 || parts[0] !== userId || !/^[\w.-]+\.(?:png|jpe?g)$/i.test(parts[1])) return null;
    return path;
}

export default function ReportScreenshot({ reference, userId }) {
    const [image, setImage] = useState(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let active = true;
        let objectUrl;
        setImage(null);
        setFailed(false);
        async function load() {
            const path = screenshotPath(reference, userId);
            if (!path) throw new Error("invalid_path");
            const { data, error } = await supabase.storage.from("reports-screenshots").download(path);
            if (error || !["image/png", "image/jpeg"].includes(data?.type)) throw new Error("unavailable");
            if (active) {
                objectUrl = URL.createObjectURL(data);
                setImage(objectUrl);
            }
        }
        load().catch(() => { if (active) setFailed(true); });
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [reference, userId]);
    if (!image) return <p role="status">{failed ? "Снимката е недостъпна." : "Зареждане на снимката…"}</p>;
    return <a href={image} target="_blank" rel="noopener noreferrer">
        <img src={image} alt="Снимка към сигнала" className="rounded-xl border border-base-200 max-h-60 object-contain cursor-zoom-in" />
    </a>;
}
