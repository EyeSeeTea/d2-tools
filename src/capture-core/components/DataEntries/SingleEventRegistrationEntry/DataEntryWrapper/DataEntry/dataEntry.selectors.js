//
import { createSelector } from "reselect";
import { programCollection } from "../../../../../metaDataMemoryStores/programCollection/programCollection";
import {} from "../../../../../metaData";

const programIdSelector = state => state.currentSelections.programId;

// $FlowFixMe[missing-annot] automated comment
export const makeProgramNameSelector = () =>
    createSelector(programIdSelector, programId => {
        const program = programCollection.get(programId);
        const programName = (program && program.name) || "";
        return programName;
    });

const stageSelector = props => props.stage;

// $FlowFixMe[missing-annot] automated comment
export const makeWritableRelationshipTypesSelector = () =>
    createSelector(stageSelector, stage =>
        stage ? stage.relationshipTypesWhereStageIsFrom.filter(r => r.access.data.write) : []
    );
