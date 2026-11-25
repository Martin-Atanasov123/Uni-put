// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ReportScreenshot from "@/components/admin/ReportScreenshot";
import { supabase } from "@/lib/supabase";
import React from "react";

vi.mock("@/lib/supabase", () => ({ supabase: { storage: { from: vi.fn() } } }));
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
});

describe("ReportScreenshot", () => {
    it.each(["owner/report_123.jpg", "https://example.supabase.co/storage/v1/object/public/reports-screenshots/owner/report_123.jpg"])(
        "loads a trusted new or legacy reference through Storage", async reference => {
            vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
            const download = vi.fn().mockResolvedValue({ data: new Blob([], { type: "image/jpeg" }) });
            supabase.storage.from.mockReturnValue({ download });
            vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
            const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
            const view = render(<ReportScreenshot reference={reference} userId="owner" />);
            expect((await screen.findByRole("img")).src).toBe("blob:report");
            expect(download).toHaveBeenCalledWith("owner/report_123.jpg");
            view.unmount();
            expect(revoke).toHaveBeenCalledWith("blob:report");
        }
    );
    it.each(["someone-else/report.jpg", "https://unrelated.example/file.jpg"])(
        "rejects a foreign reference before loading an image", async reference => {
            vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
            render(<ReportScreenshot reference={reference} userId="owner" />);
            expect(await screen.findByText("Снимката е недостъпна.")).toBeTruthy();
            expect(supabase.storage.from).not.toHaveBeenCalled();
        }
    );
});
