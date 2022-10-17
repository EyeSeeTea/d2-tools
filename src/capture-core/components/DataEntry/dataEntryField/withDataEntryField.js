//
import * as React from "react";
import { connect } from "react-redux";
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import { placements } from "../constants/placements.const";
import { DataEntryField } from "./internal/DataEntryField.component";
import { getDataEntryKey } from "../common/getDataEntryKey";
import { makeReselectComponentProps } from "./withDataEntryField.selectors";

const getDataEntryField = (settings, InnerComponent) => {
    class DataEntryFieldBuilder extends React.Component {
        constructor(props) {
            super(props);
            this.reselectComponentProps = makeReselectComponentProps();
        }
        // $FlowFixMe[speculation-ambiguous] automated comment
        handleRef = instance => {
            if (this.props.dataEntryFieldRef) {
                const { getPropName } = settings;
                const key = getPropName(this.props);

                if (!key) {
                    log.error(
                        errorCreator("data entry field needs a key, but no propName was specified")({})
                    );
                    return;
                }
                // $FlowFixMe
                this.props.dataEntryFieldRef(instance, key);
            }
        };

        getFieldElement() {
            const { id, completionAttempted, saveAttempted, onUpdateDataEntryField } = this.props;
            const { getComponent, getComponentProps, getValidatorContainers, getPropName } = settings;

            const Component = getComponent(this.props);
            const componentProps = this.reselectComponentProps(
                getComponentProps && getComponentProps(this.props)
            );
            const validatorContainers = (getValidatorContainers && getValidatorContainers(this.props)) || [];

            return (
                <DataEntryField
                    ref={this.handleRef}
                    dataEntryId={id}
                    completionAttempted={completionAttempted}
                    saveAttempted={saveAttempted}
                    Component={Component}
                    validatorContainers={validatorContainers}
                    propName={getPropName(this.props)}
                    onUpdateField={onUpdateDataEntryField}
                    componentProps={componentProps}
                />
            );
        }

        getFields() {
            const fields = this.props.fields;
            const { getMeta, getIsHidden } = settings;
            const meta = getMeta && getMeta(this.props);

            if (getIsHidden && getIsHidden(this.props)) return fields ? [...fields] : [];

            const fieldContainer = {
                field: this.getFieldElement(),
                placement: (meta && meta.placement) || placements.TOP,
                section: meta && meta.section,
            };

            return fields ? [...fields, fieldContainer] : [fieldContainer];
        }

        render() {
            const { fields, ...passOnProps } = this.props;

            return (
                <div>
                    {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                    <InnerComponent fields={this.getFields()} {...passOnProps} />
                </div>
            );
        }
    }
    return DataEntryFieldBuilder;
};

const getMapStateToProps = settings => (state, props) => {
    let passOnFieldDataProp;
    const { getPassOnFieldData, getPropName } = settings;
    if (getPassOnFieldData && getPassOnFieldData(props)) {
        const propName = getPropName(props);
        const itemId = state.dataEntries[props.id].itemId;
        const key = getDataEntryKey(props.id, itemId);
        const value = state.dataEntriesFieldsValue[key][propName];
        passOnFieldDataProp = {
            [`${propName}DataEntryFieldValue`]: value,
        };
    }

    return {
        ...passOnFieldDataProp,
    };
};

export const withDataEntryField = settings => InnerComponent =>
    // $FlowFixMe
    connect(getMapStateToProps(settings), () => ({}))(getDataEntryField(settings, InnerComponent));
