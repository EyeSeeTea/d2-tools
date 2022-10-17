//
import { useMemo } from "react";

const processProgramTrackedEntityAttributes = programAPI =>
    programAPI?.programTrackedEntityAttributes?.reduce(
        (acc, currentValue) => ({
            ...acc,
            [currentValue.trackedEntityAttribute.id]: currentValue.trackedEntityAttribute,
        }),
        {}
    );

export const useProgramTrackedEntityAttributes = programAPI =>
    useMemo(() => processProgramTrackedEntityAttributes(programAPI), [programAPI]);
