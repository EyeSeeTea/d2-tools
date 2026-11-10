import { describe, expect, test } from "vitest";
import { AuthString } from "../common";

describe("AuthString", () => {
    test("parses USERNAME:PASSWORD", async () => {
        expect(await AuthString.from("admin:district")).toEqual({ username: "admin", password: "district" });
    });

    test("keeps colons in the password", async () => {
        expect(await AuthString.from("admin:pa:ss:word")).toEqual({
            username: "admin",
            password: "pa:ss:word",
        });
    });

    test("rejects a value without username or password, without leaking it", async () => {
        for (const value of ["admin", "admin:", ":secret"]) {
            const error = await AuthString.from(value).catch((err: Error) => err);
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).not.toContain("secret");
        }
    });
});
