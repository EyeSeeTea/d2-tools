//
import { connect } from "react-redux";
import { ExistingTEIContentsComponent } from "./ExistingTEIContents.component";
import { makeDataElementsSelector, makeGetClientValuesSelector } from "./existingTEIContents.selectors";

const makeMapStateToProps = () => {
    const dataElementsSelector = makeDataElementsSelector();
    const clientValuesSelector = makeGetClientValuesSelector();
    const mapStateToProps = (state, props) => {
        const dataElements = dataElementsSelector(props);
        const attributeValues = clientValuesSelector(props, dataElements);
        return {
            programId: state.newRelationshipRegisterTei.programId,
            dataElements,
            attributeValues,
        };
    };
    return mapStateToProps;
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
    const { programId, tetAttributesOnly, errorData, ...passOnOwnProps } = ownProps;
    return {
        ...passOnOwnProps,
        ...stateProps,
        ...dispatchProps,
        teiId: errorData.id,
    };
};

// $FlowFixMe
export const ExistingTEIContents = connect(
    makeMapStateToProps,
    () => ({}),
    mergeProps
)(ExistingTEIContentsComponent);
