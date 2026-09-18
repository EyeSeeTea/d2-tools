import { describe, expect, test } from "vitest";
import { haveSameLanguage, isSameLocale, normalizeLocaleCode } from "../Locale";

describe("normalizeLocaleCode", () => {
    test("maps Java legacy language codes to the current ISO codes, keeping the country", () => {
        expect(normalizeLocaleCode("in")).toBe("id");
        expect(normalizeLocaleCode("iw_IL")).toBe("he_IL");
        expect(normalizeLocaleCode("es_ES")).toBe("es_ES");
    });
});

describe("isSameLocale", () => {
    test("matches Indonesian stored as 'in' with the DB locale 'id'", () => {
        expect(isSameLocale("in", "id")).toBe(true);
        expect(isSameLocale("en", "en_GB")).toBe(false);
    });
});

describe("haveSameLanguage", () => {
    test("compares only the language part", () => {
        expect(haveSameLanguage("en", "en_GB")).toBe(true);
        expect(haveSameLanguage("en", "es")).toBe(false);
    });
});
