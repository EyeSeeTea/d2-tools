//
import { getContext } from "../context";

export const confirmLoadingSequence = async stalePrograms => {
    const { storageController, storeNames } = getContext();
    await Promise.all(
        stalePrograms.map(async ({ id, version }) => {
            const program = await storageController.get(storeNames.PROGRAMS, id);
            const updatedProgram = {
                ...program,
                version,
            };
            await storageController.set(storeNames.PROGRAMS, updatedProgram);
        })
    );
};
