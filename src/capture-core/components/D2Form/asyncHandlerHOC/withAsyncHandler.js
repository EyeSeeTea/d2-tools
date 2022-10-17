//
import * as React from "react";
import { connect } from "react-redux";
import uuid from "uuid/v4";
import { fieldIsValidating, fieldsValidated, startUpdateFieldAsync } from "./actions";

// HOC wrapped around D2Form handling callbacks for async functionality
const getAsyncHandler = InnerComponent =>
    class AsyncHandlerHOC extends React.Component {
        // $FlowFixMe[missing-annot] automated comment
        handleIsValidating = (...args) => {
            const { id } = this.props;
            this.props.onIsValidating(...args, id);
        };

        // $FlowFixMe[missing-annot] automated comment
        handleFieldsValidated = (...args) => {
            const { id } = this.props;
            this.props.onFieldsValidated(...args, id);
        };

        // $FlowFixMe[missing-annot] automated comment
        handleUpdateFieldAsyncInner = (...args) => {
            const { onUpdateFieldAsyncInner, onUpdateFieldAsync } = this.props;
            onUpdateFieldAsyncInner(...args, onUpdateFieldAsync);
        };

        render() {
            const {
                onIsValidating,
                onFieldsValidated,
                onUpdateFieldAsyncInner,
                onUpdateFieldAsync,
                ...passOnProps
            } = this.props;
            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent
                    onIsValidating={this.handleIsValidating}
                    onFieldsValidated={this.handleFieldsValidated}
                    onUpdateFieldAsync={this.handleUpdateFieldAsyncInner}
                    {...passOnProps}
                />
            );
        }
    };

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onIsValidating: (fieldId, formBuilderId, validatingUid, message, fieldUIUpdates, formId) => {
        const action = fieldIsValidating(
            fieldId,
            formBuilderId,
            formId,
            message,
            fieldUIUpdates,
            validatingUid
        );
        dispatch(action);
    },
    onFieldsValidated: (fieldsUI, formBuilderId, validatingUids, formId) => {
        const action = fieldsValidated(fieldsUI, formBuilderId, formId, validatingUids);
        dispatch(action);
    },
    onUpdateFieldAsyncInner: (fieldId, fieldLabel, formBuilderId, formId, callback, onUpdateFieldAsync) => {
        const action = startUpdateFieldAsync(fieldId, fieldLabel, formBuilderId, formId, uuid(), callback);

        if (onUpdateFieldAsync) {
            onUpdateFieldAsync(action);
        } else {
            dispatch(action);
        }
    },
});

export const withAsyncHandler = () => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(mapStateToProps, mapDispatchToProps)(getAsyncHandler(InnerComponent));
