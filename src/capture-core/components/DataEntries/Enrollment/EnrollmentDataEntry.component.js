//
/* eslint-disable react/no-multi-comp */
import React from "react";
import i18n from "@dhis2/d2-i18n";
import moment from "moment";
import {} from "capture-core-utils/rulesEngine";
import {
    DataEntry,
    placements,
    withDataEntryField,
    withDataEntryFieldIfApplicable,
    withBrowserBackWarning,
    inMemoryFileStore,
} from "../../DataEntry";
import {
    withInternalChangeHandler,
    withLabel,
    withFocusSaver,
    DateField,
    CoordinateField,
    PolygonField,
    withCalculateMessages,
    withDisplayMessages,
    withFilterProps,
    withDefaultFieldContainer,
    withDefaultShouldUpdateInterface,
    orientations,
} from "../../FormFields/New";

import labelTypeClasses from "./fieldLabels.module.css";
import { getEnrollmentDateValidatorContainer, getIncidentDateValidatorContainer } from "./fieldValidators";
import { sectionKeysForEnrollmentDataEntry } from "./constants/sectionKeys.const";
import {} from "../../../metaData";

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

const getBaseComponentProps = props => ({
    fieldOptions: props.fieldOptions,
    formHorizontal: props.formHorizontal,
    styles: props.formHorizontal ? baseComponentStylesVertical : baseComponentStyles,
});

const createComponentProps = (props, componentProps) => ({
    ...getBaseComponentProps(props),
    ...componentProps,
});

const getCalendarAnchorPosition = formHorizontal => (formHorizontal ? "center" : "left");

const getEnrollmentDateSettings = () => {
    const reportDateComponent = withCalculateMessages(overrideMessagePropNames)(
        withFocusSaver()(
            withDefaultFieldContainer()(
                withDefaultShouldUpdateInterface()(
                    withLabel({
                        onGetUseVerticalOrientation: props => props.formHorizontal,
                        onGetCustomFieldLabeClass: props =>
                            `${props.fieldOptions && props.fieldOptions.fieldLabelMediaBasedClass} ${
                                labelTypeClasses.dateLabel
                            }`,
                    })(
                        withDisplayMessages()(
                            withInternalChangeHandler()(withFilterProps(defaultFilterProps)(DateField))
                        )
                    )
                )
            )
        )
    );
    const enrollmentDateSettings = {
        getComponent: () => reportDateComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                width: props && props.formHorizontal ? 150 : "100%",
                label: props.enrollmentMetadata.enrollmentDateLabel,
                required: true,
                calendarWidth: props.formHorizontal ? 250 : 350,
                popupAnchorPosition: getCalendarAnchorPosition(props.formHorizontal),
                calendarMaxMoment: !props.enrollmentMetadata.allowFutureEnrollmentDate ? moment() : undefined,
            }),
        getPropName: () => "enrolledAt",
        getValidatorContainers: props =>
            getEnrollmentDateValidatorContainer(props.enrollmentMetadata.allowFutureEnrollmentDate),
        getMeta: () => ({
            placement: placements.TOP,
            section: sectionKeysForEnrollmentDataEntry.ENROLLMENT,
        }),
    };

    return enrollmentDateSettings;
};

const getIncidentDateSettings = () => {
    const reportDateComponent = withCalculateMessages(overrideMessagePropNames)(
        withFocusSaver()(
            withDefaultFieldContainer()(
                withDefaultShouldUpdateInterface()(
                    withLabel({
                        onGetUseVerticalOrientation: props => props.formHorizontal,
                        onGetCustomFieldLabeClass: props =>
                            `${props.fieldOptions && props.fieldOptions.fieldLabelMediaBasedClass} ${
                                labelTypeClasses.dateLabel
                            }`,
                    })(
                        withDisplayMessages()(
                            withInternalChangeHandler()(withFilterProps(defaultFilterProps)(DateField))
                        )
                    )
                )
            )
        )
    );
    const incidentDateSettings = {
        isApplicable: props => {
            const showIncidentDate = props.enrollmentMetadata.showIncidentDate;
            return showIncidentDate;
        },
        getComponent: () => reportDateComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                width: props && props.formHorizontal ? 150 : "100%",
                label: props.enrollmentMetadata.incidentDateLabel,
                required: true,
                calendarWidth: props.formHorizontal ? 250 : 350,
                popupAnchorPosition: getCalendarAnchorPosition(props.formHorizontal),
                calendarMaxMoment: !props.enrollmentMetadata.allowFutureIncidentDate ? moment() : undefined,
            }),
        getPropName: () => "occurredAt",
        getValidatorContainers: props =>
            getIncidentDateValidatorContainer(props.enrollmentMetadata.allowFutureIncidentDate),
        getMeta: () => ({
            placement: placements.TOP,
            section: sectionKeysForEnrollmentDataEntry.ENROLLMENT,
        }),
    };

    return incidentDateSettings;
};

const pointComponent = withCalculateMessages(overrideMessagePropNames)(
    withFocusSaver()(
        withDefaultFieldContainer()(
            withDefaultShouldUpdateInterface()(
                withLabel({
                    onGetUseVerticalOrientation: props => props.formHorizontal,
                    onGetCustomFieldLabeClass: props =>
                        `${props.fieldOptions && props.fieldOptions.fieldLabelMediaBasedClass} ${
                            labelTypeClasses.coordinateLabel
                        }`,
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
                        `${props.fieldOptions && props.fieldOptions.fieldLabelMediaBasedClass} ${
                            labelTypeClasses.polygonLabel
                        }`,
                })(
                    withDisplayMessages()(
                        withInternalChangeHandler()(withFilterProps(defaultFilterProps)(PolygonField))
                    )
                )
            )
        )
    )
);

const getOrientation = formHorizontal => (formHorizontal ? orientations.VERTICAL : orientations.HORIZONTAL);

const getGeometrySettings = () => ({
    isApplicable: props => {
        const featureType = props.enrollmentMetadata.enrollmentForm.featureType;
        return ["Polygon", "Point"].includes(featureType);
    },
    getComponent: props => {
        const featureType = props.enrollmentMetadata.enrollmentForm.featureType;
        if (featureType === "Polygon") {
            return polygonComponent;
        }

        return pointComponent;
    },
    getComponentProps: props => {
        const featureType = props.enrollmentMetadata.enrollmentForm.featureType;
        if (featureType === "Polygon") {
            return createComponentProps(props, {
                width: props && props.formHorizontal ? 150 : 350,
                label: i18n.t("Area"),
                dialogLabel: i18n.t("Area"),
                required: false,
                orientation: getOrientation(props.formHorizontal),
            });
        }

        return createComponentProps(props, {
            width: props && props.formHorizontal ? 150 : 350,
            label: i18n.t("Coordinate"),
            dialogLabel: i18n.t("Coordinate"),
            required: false,
            orientation: getOrientation(props.formHorizontal),
            shrinkDisabled: props.formHorizontal,
        });
    },
    getPropName: () => "geometry",
    getValidatorContainers: () => [],
    getMeta: () => ({
        placement: placements.TOP,
        section: sectionKeysForEnrollmentDataEntry.ENROLLMENT,
    }),
});

// final step before the generic dataEntry is inserted
class FinalEnrollmentDataEntry extends React.Component {
    componentWillUnmount() {
        inMemoryFileStore.clear();
    }

    static dataEntrySectionDefinitions = {
        [sectionKeysForEnrollmentDataEntry.ENROLLMENT]: {
            placement: placements.TOP,
            name: i18n.t("Enrollment"),
        },
    };

    render() {
        const { enrollmentMetadata, programId, ...passOnProps } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <DataEntry
                {...passOnProps}
                dataEntrySections={FinalEnrollmentDataEntry.dataEntrySectionDefinitions}
                formFoundation={enrollmentMetadata.enrollmentForm}
            />
        );
    }
}

const LocationHOC = withDataEntryFieldIfApplicable(getGeometrySettings())(FinalEnrollmentDataEntry);
const IncidentDateFieldHOC = withDataEntryFieldIfApplicable(getIncidentDateSettings())(LocationHOC);
const EnrollmentDateFieldHOC = withDataEntryField(getEnrollmentDateSettings())(IncidentDateFieldHOC);
const BrowserBackWarningHOC = withBrowserBackWarning()(EnrollmentDateFieldHOC);

class PreEnrollmentDataEntryPure extends React.PureComponent {
    render() {
        return <BrowserBackWarningHOC {...this.props} />;
    }
}

export class EnrollmentDataEntryComponent extends React.Component {
    getValidationContext = () => {
        const { orgUnit, onGetUnsavedAttributeValues, programId, teiId } = this.props;
        return {
            programId,
            orgUnitId: orgUnit.id,
            trackedEntityInstanceId: teiId,
            onGetUnsavedAttributeValues,
        };
    };

    handleUpdateField = (...args) => {
        const { programId, orgUnit } = this.props;
        this.props.onUpdateField(...args, programId, orgUnit);
    };

    handleUpdateDataEntryField = (...args) => {
        const { programId, orgUnit } = this.props;
        this.props.onUpdateDataEntryField(...args, programId, orgUnit);
    };

    handleStartAsyncUpdateField = (...args) => {
        const { programId, orgUnit } = this.props;
        this.props.onStartAsyncUpdateField(...args, programId, orgUnit);
    };

    render() {
        const {
            orgUnit,
            programId,
            onUpdateField,
            onUpdateDataEntryField,
            onStartAsyncUpdateField,
            onGetUnsavedAttributeValues,
            ...passOnProps
        } = this.props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <PreEnrollmentDataEntryPure
                onGetValidationContext={this.getValidationContext}
                onUpdateFormField={this.handleUpdateField}
                onUpdateDataEntryField={this.handleUpdateDataEntryField}
                onUpdateFormFieldAsync={this.handleStartAsyncUpdateField}
                {...passOnProps}
            />
        );
    }
}
