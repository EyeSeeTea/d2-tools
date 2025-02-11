import { DataElement } from "domain/entities/DataElement";
import { ProgramEvent } from "domain/entities/ProgramEvent";

export const successDataElements: DataElement[] = [
    { id: "qwfxR2TQkUn", name: "Hepatitis B test indicated", valueType: "BOOLEAN" },
    { id: "L5x9z9BAgR8", name: "Follow up Hepatitis B test indicated", valueType: "BOOLEAN" },
    { id: "N0p2yOsEy7a", name: "Hepatitis B test result", valueType: "TEXT" },
    { id: "wSCh46cADN6", name: "Follow up Hepatitis B test result", valueType: "TEXT" },
];

export const mismatchedValueTypeDataElements: DataElement[] = [
    { id: "qwfxR2TQkUn", name: "Hepatitis B test indicated", valueType: "BOOLEAN" },
    { id: "L5x9z9BAgR8", name: "Follow up Hepatitis B test indicated", valueType: "TEXT" },
    { id: "N0p2yOsEy7a", name: "Hepatitis B test result", valueType: "TEXT" },
    { id: "wSCh46cADN6", name: "Follow up Hepatitis B test result", valueType: "BOOLEAN" },
];

export const missingDataElements: DataElement[] = [
    { id: "qwfxR2TQkUn", name: "Hepatitis B test indicated", valueType: "BOOLEAN" },
    { id: "N0p2yOsEy7a", name: "Hepatitis B test result", valueType: "TEXT" },
];

export const programEvents: ProgramEvent[] = [
    {
        id: "gEiU1UagRO7",
        program: { id: "srBYj2SwqPJ", name: "Sexual/gender-based violence v1", type: "tracker" },
        programStage: { id: "sgSKZRoWE9b", name: "Follow-up consultation" },
        orgUnit: { id: "d8cvwcaxzRu", name: "Kaya - CM CHR - SV" },
        dataValues: [
            {
                dataElement: { id: "qwfxR2TQkUn", name: "Hepatitis B test indicated" },
                value: "true",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
            {
                dataElement: { id: "N0p2yOsEy7a", name: "Hepatitis B test result" },
                value: "patient_refused",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
        ],
        created: "2025-01-02T01:11:54.237",
        lastUpdated: "2025-01-02T01:12:02.611",
        status: "COMPLETED",
        date: "2025-01-01T00:00:00.000",
        dueDate: "2025-01-02T01:12:02.610",
    },
];

export const expectedProgramEvents: ProgramEvent[] = [
    {
        id: "gEiU1UagRO7",
        program: { id: "srBYj2SwqPJ", name: "Sexual/gender-based violence v1", type: "tracker" },
        programStage: { id: "sgSKZRoWE9b", name: "Follow-up consultation" },
        orgUnit: { id: "d8cvwcaxzRu", name: "Kaya - CM CHR - SV" },
        dataValues: [
            {
                dataElement: { id: "L5x9z9BAgR8", name: "Follow up Hepatitis B test indicated" },
                value: "true",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
            {
                dataElement: { id: "wSCh46cADN6", name: "Follow up Hepatitis B test result" },
                value: "patient_refused",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
        ],
        created: "2025-01-02T01:11:54.237",
        lastUpdated: "2025-01-02T01:12:02.611",
        status: "COMPLETED",
        date: "2025-01-01T00:00:00.000",
        dueDate: "2025-01-02T01:12:02.610",
    },
];

export const nonEmptyTargetDataValuesEvents: ProgramEvent[] = [
    {
        id: "gEiU1UagRO7",
        program: { id: "srBYj2SwqPJ", name: "Sexual/gender-based violence v1", type: "tracker" },
        programStage: { id: "sgSKZRoWE9b", name: "Follow-up consultation" },
        orgUnit: { id: "d8cvwcaxzRu", name: "Kaya - CM CHR - SV" },
        dataValues: [
            {
                dataElement: { id: "qwfxR2TQkUn", name: "Hepatitis B test indicated" },
                value: "true",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
            {
                dataElement: { id: "L5x9z9BAgR8", name: "Follow up Hepatitis B test indicated" },
                value: "true",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
        ],
        created: "2025-01-02T01:11:54.237",
        lastUpdated: "2025-01-02T01:12:02.611",
        status: "COMPLETED",
        date: "2025-01-01T00:00:00.000",
        dueDate: "2025-01-02T01:12:02.610",
    },
];

export const missingSourceDataValuesEvents: ProgramEvent[] = [
    {
        id: "gEiU1UagRO7",
        program: { id: "srBYj2SwqPJ", name: "Sexual/gender-based violence v1", type: "tracker" },
        programStage: { id: "sgSKZRoWE9b", name: "Follow-up consultation" },
        orgUnit: { id: "d8cvwcaxzRu", name: "Kaya - CM CHR - SV" },
        dataValues: [
            {
                dataElement: { id: "someid", name: "somename" },
                value: "somevalue",
                storedBy: "user1",
                lastUpdated: "2025-01-02T01:12:02.609",
            },
        ],
        created: "2025-01-02T01:11:54.237",
        lastUpdated: "2025-01-02T01:12:02.611",
        status: "COMPLETED",
        date: "2025-01-01T00:00:00.000",
        dueDate: "2025-01-02T01:12:02.610",
    },
];
