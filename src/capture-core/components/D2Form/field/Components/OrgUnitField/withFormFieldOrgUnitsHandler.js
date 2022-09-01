//
import { connect } from "react-redux";
import * as React from "react";
import {
    get as getOrgUnitRoots,
    set as setOrgUnitRoots,
} from "../../../../FormFields/New/Fields/OrgUnitField/orgUnitRoots.store";
import { requestFilterFormFieldOrgUnits, resetFormFieldOrgUnitsFilter } from "./orgUnitFieldForForms.actions";
import { getOrgUnitRootsKey } from "./getOrgUnitRootsKey";

const getFormFieldOrgUnitsHandler = InnerComponent =>
    class FormFieldOrgUnitsHandlerHOC extends React.Component {
        componentWillUnmount() {
            const { formId, elementId } = this.props;
            setOrgUnitRoots(getOrgUnitRootsKey(formId, elementId), null);
        }

        handleFilterOrgUnits = searchText => {
            if (searchText) {
                this.props.filterOrgUnits(this.props.formId, this.props.elementId, searchText);
            } else {
                this.props.resetOrgUnits(this.props.formId, this.props.elementId);
            }
        };

        render() {
            const { formId, elementId, filterOrgUnits, resetOrgUnits, ...passOnProps } = this.props;
            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent onSearch={this.handleFilterOrgUnits} {...passOnProps} />
            );
        }
    };

const mapStateToProps = (state, props) => {
    const orgUnitRootsKey = getOrgUnitRootsKey(props.formId, props.elementId);
    const formFieldMisc = state.formsFieldsMisc[props.formId][props.elementId] || {};
    const roots = getOrgUnitRoots(orgUnitRootsKey) || getOrgUnitRoots("searchRoots");
    return {
        searchText: formFieldMisc.orgUnitsSearchText,
        ready: !formFieldMisc.orgUnitsLoading,
        treeKey: formFieldMisc.orgUnitsSearchText || "initial",
        roots,
    };
};

const mapDispatchToProps = dispatch => ({
    filterOrgUnits: (formId, elementId, searchText) => {
        dispatch(requestFilterFormFieldOrgUnits(formId, elementId, searchText));
    },
    resetOrgUnits: (formId, elementId) => {
        dispatch(resetFormFieldOrgUnitsFilter(formId, elementId));
    },
});

export const withFormFieldOrgUnitsHandler = () => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(mapStateToProps, mapDispatchToProps)(getFormFieldOrgUnitsHandler(InnerComponent));
