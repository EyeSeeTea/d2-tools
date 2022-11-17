//
import { useMemo } from "react";
import { programCollection } from "../metaDataMemoryStores";
import { TrackerProgram } from "../metaData";

export const useTrackedEntityTypesWithCorrelatedPrograms = () =>
    useMemo(
        () =>
            [...programCollection.values()]
                .filter(program => program instanceof TrackerProgram)
                // $FlowFixMe
                .reduce(
                    (
                        acc,
                        {
                            id: programId,
                            name: programName,
                            trackedEntityType: {
                                id: trackedEntityTypeId,
                                access: trackedEntityTypeAccess,
                                name: trackedEntityTypeName,
                                searchGroups: trackedEntityTypeSearchGroups,
                                teiRegistration: { form, inputSearchGroups },
                            },
                            searchGroups,
                            enrollment,
                        }
                    ) => {
                        const accumulatedProgramsOfTrackedEntityType = acc[trackedEntityTypeId]
                            ? acc[trackedEntityTypeId].programs
                            : [];
                        return {
                            ...acc,
                            [trackedEntityTypeId]: {
                                trackedEntityTypeId,
                                trackedEntityTypeAccess,
                                trackedEntityTypeName,
                                trackedEntityTypeSearchGroups,
                                trackedEntityTypeTeiRegistration: { form, inputSearchGroups },
                                programs: [
                                    ...accumulatedProgramsOfTrackedEntityType,
                                    { programId, programName, searchGroups, enrollment },
                                ],
                            },
                        };
                    },
                    {}
                ),
        []
    );
