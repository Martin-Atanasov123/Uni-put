// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sessionService } from "./sessionService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
    supabase: {
        auth: {
            signOut: vi.fn().mockResolvedValue({ error: null })
        }
    }
}));

const createStorageMock = () => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
};

describe("sessionService", () => {
    beforeEach(() => {
        Object.defineProperty(window, "localStorage", {
            value: createStorageMock(),
            writable: true
        });
        Object.defineProperty(window, "sessionStorage", {
            value: createStorageMock(),
            writable: true
        });

        window.localStorage.setItem("uniput_grades_fac1_spec1", "1");
        window.localStorage.setItem("uniput_setup_grades", "{}");
        window.localStorage.setItem("universities_cache", "{}");
        window.localStorage.setItem("admin_cache_v1", "{}");
        window.localStorage.setItem("admin_audit_log_v1", "[]");
        window.localStorage.setItem("sb-test-token", "token");

        window.sessionStorage.setItem("temp_key", "value");
        vi.clearAllMocks();
    });

    it("clearClientState clears localStorage and sessionStorage", () => {
        expect(window.localStorage.getItem("uniput_setup_grades")).not.toBeNull();
        expect(window.sessionStorage.getItem("temp_key")).not.toBeNull();

        sessionService.clearClientState();

        expect(window.localStorage.getItem("uniput_setup_grades")).toBeNull();
        expect(window.localStorage.getItem("sb-test-token")).toBeNull();
        expect(window.sessionStorage.getItem("temp_key")).toBeNull();
    });

    it("logout clears client state and calls supabase signOut", async () => {
        await sessionService.logout();

        expect(window.localStorage.getItem("uniput_grades_fac1_spec1")).toBeNull();
        expect(window.sessionStorage.getItem("temp_key")).toBeNull();
        expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
});

