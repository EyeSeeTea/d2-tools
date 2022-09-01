//
import { connect } from "react-redux";
import { SearchProgramSelectorComponent } from "./SearchProgramSelector.component";
import { startSetProgram } from "./searchProgramSelector.actions";
import { makeProgramOptionsSelector } from "./searchProgramSelector.selectors";

const makeMapStateToProps = () => {
    const getProgramOptions = makeProgramOptionsSelector();
    const mapStateToProps = (state, props) => ({
        selectedProgramId: state.teiSearch[props.searchId].selectedProgramId,
        programOptions: getProgramOptions(state, props),
    });
    // $FlowFixMe[not-an-object] automated comment
    return mapStateToProps;
};

const mapDispatchToProps = dispatch => ({
    onSetProgram: (searchId, programId) => {
        dispatch(startSetProgram(searchId, programId));
    },
});

// $FlowFixMe[missing-annot] automated comment
export const SearchProgramSelector = connect(
    makeMapStateToProps,
    mapDispatchToProps
)(SearchProgramSelectorComponent);
