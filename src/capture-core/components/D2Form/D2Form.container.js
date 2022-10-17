//
import { connect } from "react-redux";

import { compose } from "redux";

import { withAsyncHandler } from "./asyncHandlerHOC";
import { D2FormComponent } from "./D2Form.component";

const mapStateToProps = (state, ownProps) => {
    const { forms } = state;

    const isFormInReduxStore = !!forms[ownProps.id];
    return { isFormInReduxStore };
};

export const D2Form = compose(
    connect(mapStateToProps, () => ({})),
    withAsyncHandler()
)(D2FormComponent);
