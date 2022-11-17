//
import { useMemo } from "react";
import { isSelectionsEqual } from "../../../App/isSelectionsEqual";

export const useIsContextInSync = (programId, orgUnitId, categories, viewContext) =>
    useMemo(() => {
        if (!viewContext) {
            return false;
        }

        const currentSelections = {
            programId,
            orgUnitId,
            categories,
        };

        return isSelectionsEqual(currentSelections, viewContext);
    }, [programId, orgUnitId, categories, viewContext]);
