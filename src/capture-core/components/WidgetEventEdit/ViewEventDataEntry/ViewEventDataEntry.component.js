//
import React, { Component } from "react";
import { pipe } from "capture-core-utils";
import { withStyles } from "@material-ui/core/";
import i18n from "@dhis2/d2-i18n";
import {
    placements,
    withCleanUp,
    DataEntry,
    withDataEntryField,
    withDataEntryFieldIfApplicable,
    withBrowserBackWarning,
} from "../../../components/DataEntry";

import { DataElement, dataElementTypes } from "../../../metaData";
import { convertFormToClient, convertClientToView } from "../../../converters";

import { withLabel, withDefaultFieldContainer, ViewModeField, withFilterProps } from "../../FormFields/New";
import labelTypeClasses from "./viewEventDataEntryFieldLabels.module.css";
import { EventLabelsByStatus } from "./viewEventDataEntry.const";

const valueConvertFn = pipe(convertFormToClient, convertClientToView);

const getStyles = theme => ({
    header: {
        ...theme.typography.title,
        fontSize: 18,
        padding: theme.typography.pxToRem(10),
        borderBottom: `1px solid ${theme.palette.grey.blueGrey}`,
    },
    paper: {
        maxWidth: theme.typography.pxToRem(1070),
    },
    container: {
        flexGrow: 3,
    },
    content: {
        display: "flex",
    },
    dataEntryContainer: {
        flexGrow: 1,
        padding: theme.typography.pxToRem(10),
    },
    dataEntryActionsContainer: {
        padding: theme.typography.pxToRem(10),
        paddingTop: theme.typography.pxToRem(30),
    },
    button: {
        whiteSpace: "nowrap",
    },
    fieldLabelMediaBased: {
        [theme.breakpoints.down(523)]: {
            paddingTop: "0px !important",
        },
    },
});

const dataEntrySectionNames = {
    BASICINFO: "BASICINFO",
    STATUS: "STATUS",
    COMMENTS: "COMMENTS",
};

const baseComponentStyles = {
    labelContainerStyle: {
        flexBasis: 200,
    },
    inputContainerStyle: {
        flexBasis: 150,
    },
};

const baseComponentStylesVertical = {
    labelContainerStyle: {
        width: 150,
    },
    inputContainerStyle: {
        width: 150,
    },
};

function defaultFilterProps(props) {
    const { formHorizontal, fieldOptions, validationError, modified, ...passOnProps } = props;
    return passOnProps;
}

const getBaseComponentProps = props => ({
    fieldOptions: props.fieldOptions,
    formHorizontal: props.formHorizontal,
    styles: props.formHorizontal ? baseComponentStylesVertical : baseComponentStyles,
});

const createComponentProps = (props, componentProps) => ({
    ...getBaseComponentProps(props),
    ...componentProps,
});

const viewModeComponent = withDefaultFieldContainer()(
    withLabel({
        onGetUseVerticalOrientation: props => props.formHorizontal,
        onGetCustomFieldLabeClass: props =>
            `${props.fieldOptions.fieldLabelMediaBasedClass} ${labelTypeClasses.defaultViewLabel}`,
    })(withFilterProps(defaultFilterProps)(ViewModeField))
);

const buildReportDateSettingsFn = () => {
    const dataElement = new DataElement(o => {
        o.type = dataElementTypes.DATE;
    });

    const reportDateSettings = {
        getComponent: () => viewModeComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                label: props.formFoundation.getLabel(EventLabelsByStatus[props.eventStatus]),
                valueConverter: value => dataElement.convertValue(value, valueConvertFn),
            }),
        getPropName: props => EventLabelsByStatus[props.eventStatus],
        getMeta: () => ({
            placement: placements.TOP,
            section: dataEntrySectionNames.BASICINFO,
        }),
    };

    return reportDateSettings;
};

const buildGeometrySettingsFn = () => ({
    isApplicable: props => {
        const featureType = props.formFoundation.featureType;
        return ["Polygon", "Point"].includes(featureType);
    },
    getComponent: () => viewModeComponent,
    getComponentProps: props => {
        const featureType = props.formFoundation.featureType;
        if (featureType === "Polygon") {
            return createComponentProps(props, {
                label: i18n.t("Area"),
                valueConverter: value => (value ? "Polygon captured" : "No polygon captured"),
            });
        }
        const pointDataElement = new DataElement(o => {
            o.id = "geometry";
            o.type = dataElementTypes.COORDINATE;
        });

        return createComponentProps(props, {
            label: "Coordinate",
            valueConverter: value => pointDataElement.convertValue(value, valueConvertFn),
        });
    },
    getPropName: () => "geometry",
    getValidatorContainers: () => [],
    getMeta: () => ({
        placement: placements.TOP,
        section: dataEntrySectionNames.BASICINFO,
    }),
});

const buildCompleteFieldSettingsFn = () => {
    const dataElement = new DataElement(o => {
        o.id = "complete";
        o.type = dataElementTypes.BOOLEAN;
    });

    const completeSettings = {
        getComponent: () => viewModeComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                label: i18n.t("Event completed"),
                id: dataElement.id,
                valueConverter: value => dataElement.convertValue(value, valueConvertFn),
            }),
        getPropName: () => dataElement.id,
        getMeta: () => ({
            placement: placements.BOTTOM,
            section: dataEntrySectionNames.STATUS,
        }),
        passOnFieldData: true,
    };
    return completeSettings;
};

const CleanUpHOC = withCleanUp()(DataEntry);
const GeometryField = withDataEntryFieldIfApplicable(buildGeometrySettingsFn())(CleanUpHOC);
const ReportDateField = withDataEntryField(buildReportDateSettingsFn())(GeometryField);
const CompletableDataEntry = withDataEntryField(buildCompleteFieldSettingsFn())(ReportDateField);
const DataEntryWrapper = withBrowserBackWarning()(CompletableDataEntry);

const dataEntrySectionDefinitions = {
    [dataEntrySectionNames.BASICINFO]: {
        placement: placements.TOP,
        name: i18n.t("Basic info"),
    },
    [dataEntrySectionNames.STATUS]: {
        placement: placements.BOTTOM,
        name: i18n.t("Status"),
    },
    [dataEntrySectionNames.COMMENTS]: {
        placement: placements.BOTTOM,
        name: i18n.t("Comments"),
    },
};

class ViewEventDataEntryPlain extends Component {
    constructor(props) {
        super(props);
        this.fieldOptions = {
            theme: props.theme,
            fieldLabelMediaBasedClass: props.classes.fieldLabelMediaBased,
        };
        this.dataEntrySections = dataEntrySectionDefinitions;
    }
    render() {
        const { classes, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <DataEntryWrapper
                id={"singleEvent"}
                viewMode
                fieldOptions={this.fieldOptions}
                dataEntrySections={this.dataEntrySections}
                {...passOnProps}
            />
        );
    }
}

export const ViewEventDataEntryComponent = withStyles(getStyles)(ViewEventDataEntryPlain);
