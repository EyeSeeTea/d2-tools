//
import * as React from "react";
import { connect } from "react-redux";
import { updateField } from "../../actions/dataEntry.actions";
import { getValidationError } from "./dataEntryField.utils";
import { getDataEntryKey } from "../../common/getDataEntryKey";

class DataEntryFieldPlain extends React.Component {
    validateAndScrollToIfFailed() {
        const isValid = this.props.valueMeta && this.props.valueMeta.isValid;

        if (!isValid) {
            this.goto();
        }

        return isValid;
    }

    goto() {
        if (this.gotoInstance) {
            this.gotoInstance.scrollIntoView();

            const scrolledY = window.scrollY;
            if (scrolledY) {
                // TODO: Set the modifier some other way (caused be the fixed header)
                window.scroll(0, scrolledY - 48);
            }
        }
    }

    handleSet = (value, options) => {
        const { validatorContainers, onUpdateFieldInner, onUpdateField } = this.props;
        const validationError = getValidationError(value, validatorContainers);
        onUpdateFieldInner(
            value,
            {
                isValid: !validationError,
                validationError,
                touched: options && options.touched != null ? options.touched : true,
            },
            this.props.propName,
            this.props.dataEntryId,
            this.props.itemId,
            onUpdateField
        );
    };

    render() {
        const {
            completionAttempted,
            saveAttempted,
            Component,
            validatorContainers,
            propName,
            onUpdateField,
            onUpdateFieldInner,
            valueMeta = {},
            itemId,
            dataEntryId,
            componentProps,
            ...passOnProps
        } = this.props;
        const { isValid, type, ...passOnValueMeta } = valueMeta;
        return (
            <div
                ref={gotoInstance => {
                    this.gotoInstance = gotoInstance;
                }}
                key={propName}
                data-test={`dataentry-field-${propName}`}
            >
                <Component
                    onBlur={this.handleSet}
                    validationAttempted={!!(completionAttempted || saveAttempted)}
                    {...passOnValueMeta}
                    {...passOnProps}
                    {...componentProps}
                />
            </div>
        );
    }
}

const mapStateToProps = (state, props) => {
    const propName = props.propName;
    const itemId = state.dataEntries[props.dataEntryId].itemId;
    const key = getDataEntryKey(props.dataEntryId, itemId);

    return {
        value: state.dataEntriesFieldsValue[key][propName],
        valueMeta: state.dataEntriesFieldsUI[key][propName],
        itemId,
        propName,
    };
};

const mapDispatchToProps = dispatch => ({
    onUpdateFieldInner: (value, valueMeta, fieldId, dataEntryId, itemId, onUpdateField) => {
        const action = updateField(value, valueMeta, fieldId, dataEntryId, itemId);
        if (onUpdateField) {
            onUpdateField(action, {
                value,
                valueMeta,
                fieldId,
                dataEntryId,
                itemId,
            });
        } else {
            dispatch(updateField(value, valueMeta, fieldId, dataEntryId, itemId));
        }
    },
});

// $FlowFixMe
export const DataEntryField = connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(
    DataEntryFieldPlain
);
