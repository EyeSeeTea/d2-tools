import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { parseUserDateOverridesFile } from "../userMonitoring";

describe("parseUserDateOverridesFile", () => {
    let tmpFile: string;

    beforeEach(() => {
        tmpFile = path.join(os.tmpdir(), `test-overrides-${Date.now()}.json`);
    });

    afterEach(() => {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    it("Should parse a valid overrides file", () => {
        fs.writeFileSync(
            tmpFile,
            JSON.stringify({ createdDate: "2026-06-10", users: [{ id: "uid1" }, { id: "uid2", username: "pepito" }] })
        );
        const result = parseUserDateOverridesFile(tmpFile);
        expect(result.createdDate).toBe("2026-06-10");
        expect(result.users).toHaveLength(2);
    });

    it("Should throw if the file does not contain valid JSON", () => {
        fs.writeFileSync(tmpFile, "this is not json {{{");
        expect(() => parseUserDateOverridesFile(tmpFile)).toThrow(
            `Could not parse ${tmpFile} as JSON. Make sure the file contains valid JSON.`
        );
    });

    it("Should throw if createdDate field is missing", () => {
        fs.writeFileSync(tmpFile, JSON.stringify({ users: [{ id: "uid1" }] }));
        expect(() => parseUserDateOverridesFile(tmpFile)).toThrow(`Invalid format in ${tmpFile}`);
    });

    it("Should throw if users field is missing", () => {
        fs.writeFileSync(tmpFile, JSON.stringify({ createdDate: "2026-06-10" }));
        expect(() => parseUserDateOverridesFile(tmpFile)).toThrow(`Invalid format in ${tmpFile}`);
    });

    it("Should throw if createdDate is not a valid date", () => {
        fs.writeFileSync(tmpFile, JSON.stringify({ createdDate: "not-a-date", users: [] }));
        expect(() => parseUserDateOverridesFile(tmpFile)).toThrow(
            `Invalid createdDate "not-a-date" in ${tmpFile}: must be a valid ISO date (e.g. "2026-06-10").`
        );
    });

    it("Should throw if createdDate is a non-ISO date format (e.g. DD/MM/YYYY)", () => {
        fs.writeFileSync(tmpFile, JSON.stringify({ createdDate: "10/06/2026", users: [] }));
        expect(() => parseUserDateOverridesFile(tmpFile)).toThrow(
            `Invalid createdDate "10/06/2026" in ${tmpFile}: must be a valid ISO date (e.g. "2026-06-10").`
        );
    });

    it("Should throw if the file does not exist", () => {
        expect(() => parseUserDateOverridesFile("/nonexistent/path/file.json")).toThrow(
            "Could not parse /nonexistent/path/file.json as JSON. Make sure the file contains valid JSON."
        );
    });
});
