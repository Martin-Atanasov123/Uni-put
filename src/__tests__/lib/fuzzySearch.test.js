import { describe, it, expect } from "vitest";
import { buildVocabulary, editDistance, closestWords, wordHasHit } from "@/lib/fuzzySearch";

const vocab = buildVocabulary([
    "Медицина", "Дентална медицина", "Психология", "Информатика", "Компютърни науки", "Маркетинг",
    "Икономика", "Право", "Архитектура", "Педагогика на обучението по физика", "Международни отношения",
]);

describe("buildVocabulary", () => {
    it("взима думи ≥4 букви в малки букви, без дубликати", () => {
        expect(vocab.has("медицина")).toBe(true);
        expect(vocab.has("на")).toBe(false);
        expect([...vocab].filter((w) => w === "медицина")).toHaveLength(1);
    });
});

describe("editDistance", () => {
    it("брои замяна, вмъкване и изтриване", () => {
        expect(editDistance("медицина", "медицина")).toBe(0);
        expect(editDistance("медицинна", "медицина")).toBe(1);
        expect(editDistance("маркетнг", "маркетинг")).toBe(1);
        expect(editDistance("абвгд", "яяяяя", 2)).toBeGreaterThan(2);
    });
});

describe("closestWords", () => {
    it("поправя правописна грешка", () => {
        expect(closestWords("медицинна", vocab)[0]).toBe("медицина");
        expect(closestWords("психлогия", vocab)[0]).toBe("психология");
        expect(closestWords("маркетнг", vocab)).toContain("маркетинг");
    });
    it("не хваща далечни думи с различна първа буква", () => {
        const v = buildVocabulary(["Биология", "Психология"]);
        expect(closestWords("психлогия", v)).toEqual(["психология"]);
    });
    it("хваща друга форма на думата (общ префикс)", () => {
        expect(closestWords("медицински", vocab)).toContain("медицина");
        expect(closestWords("компютри", vocab)).toContain("компютърни");
    });
    it("не предлага произволни думи и къси думи", () => {
        expect(closestWords("футбол", vocab)).toEqual([]);
        expect(closestWords("ит", vocab)).toEqual([]);
    });
    it("не връща самата дума и уважава max", () => {
        expect(closestWords("медицина", vocab)).not.toContain("медицина");
        expect(closestWords("медицинна", vocab, 1)).toHaveLength(1);
    });
});

describe("wordHasHit", () => {
    it("вярно, когато вариант се съдържа в дума от речника", () => {
        expect(wordHasHit(["психолог"], vocab)).toBe(true);
        expect(wordHasHit(["медицинна"], vocab)).toBe(false);
    });
});
