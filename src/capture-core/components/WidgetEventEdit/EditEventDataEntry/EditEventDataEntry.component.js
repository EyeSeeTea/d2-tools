//
import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import i18n from "@dhis2/d2-i18n";

import { getEventDateValidatorContainers } from "../DataEntry/fieldValidators/eventDate.validatorContainersGetter";

import { withMainButton } from "../DataEntry/withMainButton";
import { withFilterProps } from "../../FormFields/New/HOC/withFilterProps";

import {
    DataEntry,
    withSaveHandler,
    withCancelButton,
    withDataEntryField,
    withDataEntryFieldIfApplicable,
    placements,
    withCleanUp,
    withBrowserBackWarning,
} from "../../../components/DataEntry";
import {
    withInternalChangeHandler,
    withLabel,
    withFocusSaver,
    DateField,
    TrueOnlyField,
    CoordinateField,
    PolygonField,
    withCalculateMessages,
    withDisplayMessages,
    withDefaultFieldContainer,
    withDefaultShouldUpdateInterface,
} from "../../FormFields/New";

import { inMemoryFileStore } from "../../DataEntry/file/inMemoryFileStore";
import labelTypeClasses from "../DataEntry/dataEntryFieldLabels.module.css";
import { withDeleteButton } from "../DataEntry/withDeleteButton";

const getStyles = theme => ({
    dataEntryContainer: {},
    fieldLabelMediaBased: {
        [theme.breakpoints.down(523)]: {
            paddingTop: "0px !important",
        },
    },
});

const dataEntrySectionNames = {
    BASICINFO: "BASICINFO",
    STATUS: "STATUS",
};

const overrideMessagePropNames = {
    errorMessage: "validationError",
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

const getCancelOptions = () => ({
    color: "primary",
});

const getBaseComponentProps = props => ({
    fieldOptions: props.fieldOptions,
    formHorizontal: props.formHorizontal,
    styles: props.formHorizontal ? baseComponentStylesVertical : baseComponentStyles,
});

const createComponentProps = (props, componentProps) => ({
    ...getBaseComponentProps(props),
    ...componentProps,
});

const buildReportDateSettingsFn = () => {
    const reportDateComponent = withCalculateMessages(overrideMessagePropNames)(
        withFocusSaver()(
            withDefaultFieldContainer()(
                withDefaultShouldUpdateInterface()(
                    withLabel({
                        onGetUseVerticalOrientation: props => props.formHorizontal,
                        onGetCustomFieldLabeClass: props =>
                            `${props.fieldOptions.fieldLabelMediaBasedClass} ${labelTypeClasses.dateLabel}`,
                    })(
                        withDisplayMessages()(
                            withInternalChangeHandler()(withFilterProps(defaultFilterProps)(DateField))
                        )
                    )
                )
            )
        )
    );
    const reportDateSettings = {
        getComponent: () => reportDateComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                width: "100%",
                calendarWidth: 350,
                label: props.formFoundation.getLabel("occurredAt"),
                required: true,
            }),
        getPropName: () => "occurredAt",
        getValidatorContainers: () => getEventDateValidatorContainers(),
        getMeta: () => ({
            placement: placements.TOP,
            section: dataEntrySectionNames.BASICINFO,
        }),
    };

    return reportDateSettings;
};

const pointComponent = withCalculateMessages(overrideMessagePropNames)(
    withFocusSaver()(
        withDefaultFieldContainer()(
            withDefaultShouldUpdateInterface()(
                withLabel({
                    onGetUseVerticalOrientation: props => props.formHorizontal,
                    onGetCustomFieldLabeClass: props =>
                        `${props.fieldOptions.fieldLabelMediaBasedClass} ${labelTypeClasses.coordinateLabel}`,
                })(
                    withDisplayMessages()(
                        withInternalChangeHandler()(withFilterProps(defaultFilterProps)(CoordinateField))
                    )
                )
            )
        )
    )
);

const polygonComponent = withCalculateMessages(overrideMessagePropNames)(
    withFocusSaver()(
        withDefaultFieldContainer()(
            withDefaultShouldUpdateInterface()(
                withLabel({
                    onGetUseVerticalOrientation: props => props.formHorizontal,
                    onGetCustomFieldLabeClass: props =>
                        `${props.fieldOptions.fieldLabelMediaBasedClass} ${labelTypeClasses.polygonLabel}`,
                })(
                    withDisplayMessages()(
                        withInternalChangeHandler()(withFilterProps(defaultFilterProps)(PolygonField))
                    )
                )
            )
        )
    )
);

const buildGeometrySettingsFn = () => ({
    isApplicable: props => {
        const featureType = props.formFoundation.featureType;
        return ["Polygon", "Point"].includes(featureType);
    },
    getComponent: props => {
        const featureType = props.formFoundation.featureType;
        if (featureType === "Polygon") {
            return polygonComponent;
        }
        return pointComponent;
    },
    getComponentProps: props => {
        const featureType = props.formFoundation.featureType;
        if (featureType === "Polygon") {
            return createComponentProps(props, {
                width: props && props.formHorizontal ? 150 : 350,
                label: i18n.t("Area"),
                dialogLabel: i18n.t("Area"),
                required: false,
            });
        }
        return createComponentProps(props, {
            width: props && props.formHorizontal ? 150 : "100%",
            label: i18n.t("Coordinate"),
            dialogLabel: i18n.t("Coordinate"),
            required: false,
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
    const completeComponent = withCalculateMessages(overrideMessagePropNames)(
        withFocusSaver()(
            withDefaultFieldContainer()(
                withDefaultShouldUpdateInterface()(
                    withLabel({
                        onGetUseVerticalOrientation: props => props.formHorizontal,
                        onGetCustomFieldLabeClass: props =>
                            `${props.fieldOptions.fieldLabelMediaBasedClass} ${labelTypeClasses.trueOnlyLabel}`,
                    })(withDisplayMessages()(withInternalChangeHandler()(TrueOnlyField)))
                )
            )
        )
    );
    const completeSettings = {
        getComponent: () => completeComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                label: i18n.t("Complete event"),
                id: "complete",
            }),
        getPropName: () => "complete",
        getValidatorContainers: () => [],
        getMeta: () => ({
            placement: placements.BOTTOM,
            section: dataEntrySectionNames.STATUS,
        }),
        getPassOnFieldData: () => true,
    };

    return completeSettings;
};

const saveHandlerConfig = {
    onIsCompleting: props => props.completeDataEntryFieldValue,
    onFilterProps: props => {
        const { completeDataEntryFieldValue, ...passOnProps } = props;
        return passOnProps;
    },
};

const CleanUpHOC = withCleanUp()(DataEntry);
const GeometryField = withDataEntryFieldIfApplicable(buildGeometrySettingsFn())(CleanUpHOC);
const ReportDateField = withDataEntryField(buildReportDateSettingsFn())(GeometryField);
const SaveableDataEntry = withSaveHandler(saveHandlerConfig)(withMainButton()(ReportDateField));
const CancelableDataEntry = withCancelButton(getCancelOptions)(SaveableDataEntry);
const CompletableDataEntry = withDataEntryField(buildCompleteFieldSettingsFn())(CancelableDataEntry);
const DeletableDataEntry = withDeleteButton()(CompletableDataEntry);
const DataEntryWrapper = withBrowserBackWarning()(DeletableDataEntry);

const dataEntrySectionDefinitions = {
    [dataEntrySectionNames.BASICINFO]: {
        placement: placements.TOP,
        name: i18n.t("Basic info"),
    },
    [dataEntrySectionNames.STATUS]: {
        placement: placements.BOTTOM,
        name: i18n.t("Status"),
    },
};

class EditEventDataEntryPlain extends Component {
    constructor(props) {
        super(props);
        this.fieldOptions = {
            theme: props.theme,
            fieldLabelMediaBasedClass: props.classes.fieldLabelMediaBased,
        };
        this.dataEntrySections = dataEntrySectionDefinitions;
    }
    componentWillUnmount() {
        inMemoryFileStore.clear();
    }
    render() {
        const {
            orgUnit,
            onUpdateDataEntryField,
            onUpdateField,
            onStartAsyncUpdateField,
            onSave,
            classes,
            ...passOnProps
        } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <DataEntryWrapper
                id={"singleEvent"}
                onUpdateDataEntryField={onUpdateDataEntryField(orgUnit)}
                onUpdateFormField={onUpdateField(orgUnit)}
                onUpdateFormFieldAsync={onStartAsyncUpdateField(orgUnit)}
                onSave={onSave(orgUnit)}
                fieldOptions={this.fieldOptions}
                dataEntrySections={this.dataEntrySections}
                {...passOnProps}
            />
        );
    }
}

export const EditEventDataEntryComponent = withStyles(getStyles)(EditEventDataEntryPlain);
