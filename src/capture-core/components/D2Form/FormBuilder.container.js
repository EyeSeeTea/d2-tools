//
import React from "react";
import { connect } from "react-redux";
import { FormBuilder } from "capture-ui/FormBuilder/FormBuilder.component";
import { updateFieldUIOnly } from "./formBuilder.actions";

const FormBuilderRefBuilder = props => {
    const { formBuilderRef, ...passOnProps } = props;
    return <FormBuilder ref={formBuilderRef} {...passOnProps} />;
};

const mapStateToProps = (state, props) => ({
    fieldsUI: state.formsSectionsFieldsUI[props.id] || {},
});

const mapDispatchToProps = dispatch => ({
    onUpdateFieldUIOnly: (uiState, fieldId, formBuilderId) => {
        dispatch(updateFieldUIOnly(uiState, fieldId, formBuilderId));
    },
});

// $FlowFixMe
export const FormBuilderContainer = connect(mapStateToProps, mapDispatchToProps)(FormBuilderRefBuilder);
