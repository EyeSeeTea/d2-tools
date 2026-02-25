import { describe, it, expect } from "vitest";
import { D2ApiCategoryCombo, reorderCocsByOptionIndex } from "../../data/CategoryComboD2Repository";

describe("CategoryComboD2Repository", () => {
    describe("reorderCategoryOptionCombos", () => {
        const callReorderCategoryOptionCombos = (catComboData: D2ApiCategoryCombo) =>
            reorderCocsByOptionIndex(catComboData);

        it("should sort categoryOptions by category index when same option ID appears in multiple categories", () => {
            const catComboData = {
                id: "mMSl1dvxldo",
                categories: [
                    {
                        id: "FYEU6t6pWY5",
                        categoryOptions: [
                            { id: "ApdutgFLjFX", name: "Conditional Cash" },
                            { id: "Mf3sEqeY5MH", name: "Unconditional cash" },
                            { id: "vyAxdvzFaAe", name: "Voucher" },
                        ],
                    },
                    {
                        id: "DHJ9e2i6GWQ",
                        categoryOptions: [
                            { id: "V3jZRcgMtVi", name: "IDP" },
                            { id: "GqXI6derQVz", name: "Refugee" },
                            { id: "rEqSna3GejM", name: "Host Community" },
                            { id: "BNU3TNK0GXG", name: "Returnee" },
                            { id: "bvFA7fsiN3T", name: "Not affected by displacement" },
                            { id: "UFYWqMjLnn7", name: "Other" },
                            { id: "fm1NzqBW6iU", name: "Conflict-affected but not displaced" },
                        ],
                    },
                    {
                        id: "eZ62z9CW6Tk",
                        categoryOptions: [
                            { id: "JDLJUK8KPvr", name: "Female" },
                            { id: "cUqVhaqTJjj", name: "Male" },
                        ],
                    },
                    {
                        id: "OE9bPocwkPI",
                        categoryOptions: [
                            { id: "oDcGlG3YtOW", name: "Temp/Transitional Shelter" },
                            { id: "J2nHmx9G3JA", name: "Permanent Shelter" },
                            { id: "EM36FglqBKj", name: "School Infrastructure" },
                            { id: "kfP94NKZcUf", name: "Standalone" },
                            { id: "UFYWqMjLnn7", name: "Other" },
                        ],
                    },
                ],
                categoryOptionCombos: [
                    {
                        id: "S6El1qcKMZd",
                        name: "Conditional Cash, Other, Female, Temp/Transitional Shelter",
                        categoryOptions: [
                            { id: "ApdutgFLjFX", name: "Conditional Cash" }, // cat 0
                            { id: "UFYWqMjLnn7", name: "Other" }, // cat 1
                            { id: "JDLJUK8KPvr", name: "Female" }, // cat 2
                            { id: "oDcGlG3YtOW", name: "Temp/Transitional Shelter" }, // cat 3
                        ],
                    },
                ],
            };

            const result = callReorderCategoryOptionCombos(catComboData);

            expect(result[0]?.categoryOptions).toEqual([
                { id: "ApdutgFLjFX", name: "Conditional Cash" }, // cat 0
                { id: "UFYWqMjLnn7", name: "Other" }, // cat 1
                { id: "JDLJUK8KPvr", name: "Female" }, // cat 2
                { id: "oDcGlG3YtOW", name: "Temp/Transitional Shelter" }, // cat 3
            ]);
        });

        it("should correctly sort when options are provided in wrong order", () => {
            const catComboData = {
                id: "mMSl1dvxldo",
                categories: [
                    {
                        id: "FYEU6t6pWY5",
                        categoryOptions: [
                            { id: "ApdutgFLjFX", name: "Conditional Cash" },
                            { id: "Mf3sEqeY5MH", name: "Unconditional cash" },
                        ],
                    },
                    {
                        id: "DHJ9e2i6GWQ",
                        categoryOptions: [{ id: "UFYWqMjLnn7", name: "Other" }],
                    },
                    {
                        id: "eZ62z9CW6Tk",
                        categoryOptions: [
                            { id: "JDLJUK8KPvr", name: "Female" },
                            { id: "cUqVhaqTJjj", name: "Male" },
                        ],
                    },
                    {
                        id: "OE9bPocwkPI",
                        categoryOptions: [
                            { id: "oDcGlG3YtOW", name: "Temp/Transitional Shelter" },
                            { id: "UFYWqMjLnn7", name: "Other" },
                        ],
                    },
                ],
                categoryOptionCombos: [
                    {
                        id: "S6El1qcKMZd",
                        name: "Conditional Cash, Other, Female, Temp/Transitional Shelter",
                        // Input: wrong order
                        categoryOptions: [
                            { id: "JDLJUK8KPvr", name: "Female" }, // cat 2
                            { id: "oDcGlG3YtOW", name: "Temp/Transitional Shelter" }, // cat 3
                            { id: "ApdutgFLjFX", name: "Conditional Cash" }, // cat 0
                            { id: "UFYWqMjLnn7", name: "Other" }, // cat 1
                        ],
                    },
                ],
            };

            const result = callReorderCategoryOptionCombos(catComboData);

            expect(result[0]?.categoryOptions).toEqual([
                { id: "ApdutgFLjFX", name: "Conditional Cash" }, // cat 0
                { id: "UFYWqMjLnn7", name: "Other" }, // cat 1
                { id: "JDLJUK8KPvr", name: "Female" }, // cat 2
                { id: "oDcGlG3YtOW", name: "Temp/Transitional Shelter" }, // cat 3
            ]);
        });

        it("should return empty categoryOptions when there are missing options", () => {
            const catComboData = {
                id: "testCatCombo",
                categories: [
                    {
                        id: "cat1",
                        categoryOptions: [{ id: "opt1", name: "Option 1" }],
                    },
                ],
                categoryOptionCombos: [
                    {
                        id: "coc1",
                        name: "Test COC",
                        categoryOptions: [
                            { id: "opt1", name: "Option 1" },
                            { id: "nonExistent", name: "Non Existent" },
                        ],
                    },
                ],
            };

            const result = callReorderCategoryOptionCombos(catComboData);

            expect(result[0]?.categoryOptions).toEqual([]);
        });

        it("should reorder cocs when categoryOptions order is wrong and options are duplicated across categories", () => {
            const catComboData = {
                name: "ComboDup",
                categories: [
                    {
                        name: "CatDup1",
                        categoryOptions: [
                            {
                                name: "school management",
                                id: "dGtkPCDfqKJ",
                            },
                            {
                                name: "Male",
                                id: "cUqVhaqTJjj",
                            },
                        ],
                        id: "xTTHxOe4ogD",
                    },
                    {
                        name: "CatDup2",
                        categoryOptions: [
                            {
                                name: "psycho-social",
                                id: "NwnHnLEHuB7",
                            },
                            {
                                name: "workshop",
                                id: "pOLXvLHNnEm",
                            },
                        ],
                        id: "AK0tGV68BYS",
                    },
                    {
                        name: "CatDup3",
                        categoryOptions: [
                            {
                                name: "psycho-social",
                                id: "NwnHnLEHuB7",
                            },
                            {
                                name: "school management",
                                id: "dGtkPCDfqKJ",
                            },
                        ],
                        id: "QsSV5GB535K",
                    },
                ],
                id: "djIjuwzmmhe",
                categoryOptionCombos: [
                    {
                        name: "school management, psycho-social, school management",
                        categoryOptions: [
                            {
                                name: "psycho-social",
                                id: "NwnHnLEHuB7",
                            },
                            {
                                name: "school management",
                                id: "dGtkPCDfqKJ",
                            },
                        ],
                        id: "joTLqFolI1w",
                    },
                ],
            };

            const result = callReorderCategoryOptionCombos(catComboData);

            expect(result[0]?.categoryOptions).toEqual([
                { id: "dGtkPCDfqKJ", name: "school management" },
                { id: "NwnHnLEHuB7", name: "psycho-social" },
            ]);
        });
    });
});
