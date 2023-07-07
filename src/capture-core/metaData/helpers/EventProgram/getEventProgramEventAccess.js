//
import { getEventProgramThrowIfNotFound } from "./getEventProgramThrowIfNotFound";

export function getEventProgramEventAccess(programId, categoriesMeta) {
    const program = getEventProgramThrowIfNotFound(programId);
    const stage = program.stage;
    const access = {
        read: stage.stageForm.access.data.read,
        write: stage.stageForm.access.data.write,
    };

    if (categoriesMeta && access.write) {
        access.write = Object.keys(categoriesMeta).every(key => categoriesMeta[key].writeAccess);
    }

    return access;
}
