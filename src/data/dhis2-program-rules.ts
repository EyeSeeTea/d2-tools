import { rulesEngine } from "capture-core/rules/rulesEngine";

export function runProgramRules() {
    const constants = [{ id: "constant123", displayName: "Constant", value: 123 }];

    const dataElements = {
        oZg33kd9taw: { id: "oZg33kd9taw", valueType: "TEXT" },
    };

    const trackedEntityAttributes = {
        w75KJ2mc4zz: { id: "w75KJ2mc4zz", valueType: "TEXT" },
    };

    const programRules = [
        {
            id: "g82J3xsNer9",
            condition: "true",
            displayName: "Testing the functions!",
            programId: "IpHINAT79UW",
            programRuleActions: [
                {
                    id: "Eeb7Ixr4Pvx",
                    dataElementId: "oZg33kd9taw",
                    data: "d2:round(d2:yearsBetween(A{birthYear},V{event_date}))",
                    programRuleActionType: "ASSIGN",
                },
            ],
        },
    ];

    const optionSets = {};
    const orgUnit = { id: "DiszpKrYNg8", name: "Ngelehun CHC" };

    const programRuleVariables = [
        {
            id: "RycV5uDi66i",
            trackedEntityAttributeId: "w75KJ2mc4zz",
            displayName: "birthYear",
            programId: "eBAyeGv0exc",
            programRuleVariableSourceType: "TEI_ATTRIBUTE",
            useNameForOptionSet: false,
        },
    ];

    const enrollmentData = { enrolledAt: "2020-05-14T22:00:00.000Z" };
    const teiValues = { w75KJ2mc4zz: "2001" }; // Record<DataElementId, value>
    const currentEvent = { occurredAt: "2022-01-01T10:12:33.000Z" };

    const rulesEffects = rulesEngine.getProgramRuleEffects({
        programRulesContainer: {
            programRuleVariables,
            programRules,
            constants,
        },
        currentEvent,
        trackedEntityAttributes,
        selectedEntity: teiValues,
        selectedEnrollment: enrollmentData,
        selectedOrgUnit: orgUnit,
        optionSets,
        dataElements,
    });

    console.log(rulesEffects);

    /*
    expect(rulesEffects).toEqual([
        {
            type: "ASSIGN",
            targetDataType: "dataElement",
            id: "oZg33kd9taw",
            value: "21",
        },
    ]);
    */
}
