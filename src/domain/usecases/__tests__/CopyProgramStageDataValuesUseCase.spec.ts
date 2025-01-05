import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    successDataElements,
    mismatchedValueTypeDataElements,
    missingDataElements,
    programEvents,
    nonEmptyTargetDataValuesEvents,
    missingSourceDataValuesEvents,
    expectedProgramEvents,
} from "./CopyProgramStageDataValuesUseCase.data";
import {
    CopyProgramStageDataValuesOptions,
    CopyProgramStageDataValuesUseCase,
} from "domain/usecases/CopyProgramStageDataValuesUseCase";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";

describe("CopyProgramStageDataValuesUseCase", () => {
    let programEventsRepository: ProgramEventsRepository;
    let orgUnitRepository: OrgUnitRepository;
    let dataElementsRepository: DataElementsRepository;
    let useCase: CopyProgramStageDataValuesUseCase;

    beforeEach(() => {
        programEventsRepository = {
            get: vi.fn().mockResolvedValue(programEvents),
            save: vi.fn().mockResolvedValue({ type: "success" }),
        } as unknown as ProgramEventsRepository;

        orgUnitRepository = {
            getRoot: vi.fn().mockResolvedValue({ id: "rootOrgUnitId" }),
        } as unknown as OrgUnitRepository;

        dataElementsRepository = {
            getByIds: vi.fn().mockResolvedValue(successDataElements),
        } as unknown as DataElementsRepository;

        useCase = new CopyProgramStageDataValuesUseCase(
            programEventsRepository,
            orgUnitRepository,
            dataElementsRepository
        );
    });

    it("should copy data values successfully", async () => {
        const eventsWithNewDataValues = await useCase.execute({
            programStageId: "sgSKZRoWE9b",
            dataElementIdPairs: [
                ["qwfxR2TQkUn", "L5x9z9BAgR8"],
                ["N0p2yOsEy7a", "wSCh46cADN6"],
            ],
            post: true,
        });

        expect(programEventsRepository.save).toHaveBeenCalled();
        expect(eventsWithNewDataValues).toEqual(expectedProgramEvents);
    });

    it("should throw error if data element types do not match", async () => {
        dataElementsRepository.getByIds = vi.fn().mockResolvedValue(mismatchedValueTypeDataElements);

        await expect(useCase.execute(commonArgs)).rejects.toThrow(
            "Data elements [qwfxR2TQkUn, L5x9z9BAgR8] do not have the same type."
        );
    });

    it("should throw error if some data elements are missing", async () => {
        dataElementsRepository.getByIds = vi.fn().mockResolvedValue(missingDataElements);

        await expect(useCase.execute(commonArgs)).rejects.toThrow(
            "Data element not found for pair: [qwfxR2TQkUn, L5x9z9BAgR8]"
        );
    });

    it("should throw error if target data values are not empty", async () => {
        programEventsRepository.get = vi.fn().mockResolvedValue(nonEmptyTargetDataValuesEvents);

        await expect(useCase.execute(commonArgs)).rejects.toThrow(
            "Some data values of the destination data elements are not empty:"
        );
    });

    it("should return empty array if there is no data value with some source data element id", async () => {
        programEventsRepository.get = vi.fn().mockResolvedValue(missingSourceDataValuesEvents);

        await expect(useCase.execute(commonArgs)).resolves.toEqual([]);
    });
});

const commonArgs: CopyProgramStageDataValuesOptions = {
    programStageId: "sgSKZRoWE9b",
    dataElementIdPairs: [
        ["qwfxR2TQkUn", "L5x9z9BAgR8"],
        ["N0p2yOsEy7a", "wSCh46cADN6"],
    ],
    post: false,
};
