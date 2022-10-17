//
import { connect } from "react-redux";
import { RegUnitSelectorComponent } from "./RegUnitSelector.component";
import { changeOrgUnit, searchOrgUnitFailed } from "../registrationSection.actions";

const mapStateToProps = state => ({
    value: state.newRelationshipRegisterTei.orgUnit,
    programId: state.newRelationshipRegisterTei.programId,
});

const mapDispatchToProps = dispatch => ({
    onUpdateSelectedOrgUnit: (orgUnit, resetProgramSelection) => {
        dispatch(changeOrgUnit(orgUnit, resetProgramSelection));
    },
    onSearchError: () => {
        dispatch(searchOrgUnitFailed());
    },
});

// $FlowSuppress
// $FlowFixMe[missing-annot] automated comment
export const RegUnitSelector = connect(mapStateToProps, mapDispatchToProps)(RegUnitSelectorComponent);
