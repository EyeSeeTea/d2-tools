import { describe, expect, test, vi } from "vitest";
import { mergeProgramsWithExisting } from "../ProgramsD2Repository";
import { Program } from "domain/entities/Program";
import log from "utils/log";

/* The :owner representation, as stored: nested collections are plain id-refs and there are many
   fields the Program entity does not know about. */
const programExisting = {
    id: "PR1",
    name: "Malaria program",
    programType: "WITH_REGISTRATION",
    version: 3,
    shortName: "Malaria",
    programStages: [{ id: "stage1" }, { id: "stage2" }],
    programTrackedEntityAttributes: [{ id: "ptea1" }],
};

const program: Program = {
    id: "PR1",
    name: "Malaria program",
    programType: "WITH_REGISTRATION",
    version: 4,
    programStages: [
        {
            id: "stage1",
            programStageDataElements: [
                {
                    dataElement: {
                        id: "abc",
                        name: "Element",
                        code: "DE",
                        valueType: "TEXT",
                        optionSet: undefined,
                    },
                    displayInReports: false,
                },
            ],
        },
    ],
};

describe("mergeProgramsWithExisting", () => {
    test("takes the writable fields from the entity", () => {
        const [merged] = mergeProgramsWithExisting([programExisting], [program]);

        expect(merged).toMatchObject({ version: 4, name: "Malaria program" });
    });

    test("keeps every other field of the stored object, nested collections included", () => {
        const [merged] = mergeProgramsWithExisting([programExisting], [program]);

        // The entity only holds a partial view of programStages: it must not reach the payload.
        expect(merged).toMatchObject({
            shortName: "Malaria",
            programStages: [{ id: "stage1" }, { id: "stage2" }],
            programTrackedEntityAttributes: [{ id: "ptea1" }],
        });
    });

    test("skips programs with no stored object", () => {
        const warn = vi.spyOn(log, "warn").mockImplementation(() => undefined);

        const merged = mergeProgramsWithExisting([], [program]);

        expect(merged).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("PR1"));
    });
});
