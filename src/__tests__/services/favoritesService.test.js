// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import {
    addFavoriteId,
    removeFavoriteId,
    toggleFavoriteId,
} from "@/services/favoritesService";

describe("favoritesService", () => {
    it("adds id when not present", () => {
        const result = addFavoriteId(["1", "2"], "3");
        expect(result).toEqual(["1", "2", "3"]);
    });

    it("does not duplicate existing id", () => {
        const result = addFavoriteId(["1", "2"], "2");
        expect(result).toEqual(["1", "2"]);
    });

    it("removes id when present", () => {
        const result = removeFavoriteId(["1", "2", "3"], "2");
        expect(result).toEqual(["1", "3"]);
    });

    it("toggleFavoriteId adds when missing and removes when present", () => {
        const added = toggleFavoriteId(["1"], "2");
        expect(added).toEqual(["1", "2"]);

        const removed = toggleFavoriteId(["1", "2"], "2");
        expect(removed).toEqual(["1"]);
    });
});

