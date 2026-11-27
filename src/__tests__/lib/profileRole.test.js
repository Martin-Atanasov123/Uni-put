import { describe, expect, it } from "vitest";
import { isAdminUser, profileRoleLabel } from "@/lib/profileRole";

describe("profile role", () => {
    it("recognizes the Supabase admin app_metadata role", () => {
        const user = { app_metadata: { role: "admin" } };

        expect(isAdminUser(user)).toBe(true);
        expect(profileRoleLabel(user)).toBe("Администратор");
    });

    it("keeps regular and missing users in the candidate experience", () => {
        expect(isAdminUser({ app_metadata: { role: "user" } })).toBe(false);
        expect(profileRoleLabel({ app_metadata: {} })).toBe("Кандидат-студент");
        expect(profileRoleLabel(null)).toBe("Кандидат-студент");
    });
});
