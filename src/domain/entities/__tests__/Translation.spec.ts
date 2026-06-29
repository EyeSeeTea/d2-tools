import { describe, expect, test } from "vitest";
import { translationFieldToProperty } from "../Translation";

describe("translationFieldToProperty", () => {
    test("converts simple camelCase fields", () => {
        expect(translationFieldToProperty("name")).toBe("NAME");
        expect(translationFieldToProperty("shortName")).toBe("SHORT_NAME");
        expect(translationFieldToProperty("formName")).toBe("FORM_NAME");
        expect(translationFieldToProperty("description")).toBe("DESCRIPTION");
        expect(translationFieldToProperty("content")).toBe("CONTENT");
    });

    test("handles multi-word fields (more than one underscore)", () => {
        expect(translationFieldToProperty("leftSideDescription")).toBe("LEFT_SIDE_DESCRIPTION");
        expect(translationFieldToProperty("rightSideDescription")).toBe("RIGHT_SIDE_DESCRIPTION");
        expect(translationFieldToProperty("executionDateLabel")).toBe("EXECUTION_DATE_LABEL");
    });

    test("is tolerant of spaced and already-uppercased inputs", () => {
        expect(translationFieldToProperty("Left side description")).toBe("LEFT_SIDE_DESCRIPTION");
        expect(translationFieldToProperty("SHORT_NAME")).toBe("SHORT_NAME");
    });
});
