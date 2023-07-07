//
import { connect } from "react-redux";
import { ExistingTEILoaderComponent } from "./ExistingTEILoader.component";

const mapStateToProps = state => ({
    programId: state.newRelationshipRegisterTei.programId,
});

// $FlowFixMe
export const ExistingTEILoader = connect(mapStateToProps, () => ({}))(ExistingTEILoaderComponent);
