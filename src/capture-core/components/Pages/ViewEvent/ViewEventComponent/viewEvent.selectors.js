//

import { createSelector } from "reselect";
import { getEventProgramEventAccess, getEventProgramThrowIfNotFound } from "../../../../metaData";

const programIdSelector = state => state.currentSelections.programId;
const categoriesMetaSelector = state => state.currentSelections.categoriesMeta;

// $FlowFixMe[missing-annot] automated comment
export const makeProgramStageSelector = () =>
    createSelector(programIdSelector, programId => getEventProgramThrowIfNotFound(programId).stage);

// $FlowFixMe[missing-annot] automated comment
export const makeEventAccessSelector = () =>
    createSelector(programIdSelector, categoriesMetaSelector, (programId, categoriesMeta) =>
        getEventProgramEventAccess(programId, categoriesMeta)
    );
