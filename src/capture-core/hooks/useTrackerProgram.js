//
import { useMemo } from "react";
import { getTrackerProgramThrowIfNotFound } from "../metaData";

export const useTrackerProgram = programId =>
    useMemo(() => getTrackerProgramThrowIfNotFound(programId), [programId]);
