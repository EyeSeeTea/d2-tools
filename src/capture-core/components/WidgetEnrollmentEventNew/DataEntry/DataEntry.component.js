//
import React, { Component } from "react";
import { compose } from "redux";
import { withStyles, withTheme } from "@material-ui/core/styles";
import i18n from "@dhis2/d2-i18n";
import { DataEntry as DataEntryContainer } from "../../DataEntry/DataEntry.container";
import { withDataEntryField } from "../../DataEntry/dataEntryField/withDataEntryField";
import { withDataEntryNotesHandler } from "../../DataEntry/dataEntryNotes/withDataEntryNotesHandler";
import { Notes } from "../../Notes/Notes.component";
import { getEventDateValidatorContainers } from "./fieldValidators/eventDate.validatorContainersGetter";
import {} from "../../../metaData";
import { getNoteValidatorContainers } from "./fieldValidators/note.validatorContainersGetter";
import { placements, withCleanUp } from "../../DataEntry";
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
import { Assignee } from "./Assignee";
import { inMemoryFileStore } from "../../DataEntry/file/inMemoryFileStore";
import { addEventSaveTypes } from "./addEventSaveTypes";
import labelTypeClasses from "./dataEntryFieldLabels.module.css";
import { withDataEntryFieldIfApplicable } from "../../DataEntry/dataEntryField/withDataEntryFieldIfApplicable";
import { withTransformPropName } from "../../../HOC";

const getStyles = theme => ({
    savingContextContainer: {
        paddingTop: theme.typography.pxToRem(10),
        display: "flex",
        alignItems: "center",
        color: theme.palette.grey.dark,
        fontSize: theme.typography.pxToRem(13),
    },
    savingContextText: {
        paddingLeft: theme.typography.pxToRem(10),
    },
    savingContextNames: {
        fontWeight: "bold",
    },
    topButtonsContainer: {
        display: "flex",
        flexFlow: "row-reverse",
    },
    horizontal: {
        padding: theme.typography.pxToRem(10),
        paddingTop: theme.typography.pxToRem(20),
        paddingBottom: theme.typography.pxToRem(15),
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
    RELATIONSHIPS: "RELATIONSHIPS",
    ASSIGNEE: "ASSIGNEE",
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
                width: props && props.formHorizontal ? 150 : "100%",
                label: props.formFoundation.getLabel("occurredAt"),
                required: true,
                calendarWidth: props.formHorizontal ? 250 : 350,
                popupAnchorPosition: getCalendarAnchorPosition(props.formHorizontal),
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

const getOrientation = formHorizontal => (formHorizontal ? orientations.VERTICAL : orientations.HORIZONTAL);

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
                orientation: getOrientation(props.formHorizontal),
            });
        }

        return createComponentProps(props, {
            width: props && props.formHorizontal ? 150 : 350,
            label: "Coordinate",
            dialogLabel: "Coordinate",
            required: false,
            orientation: getOrientation(props.formHorizontal),
            shrinkDisabled: props.formHorizontal,
        });
    },
    getPropName: () => "geometry",
    getValidatorContainers: () => [],
    getMeta: () => ({
        placement: placements.TOP,
        section: dataEntrySectionNames.BASICINFO,
    }),
});

const buildNotesSettingsFn = () => {
    const noteComponent = withCalculateMessages(overrideMessagePropNames)(
        withDefaultFieldContainer()(
            withDefaultShouldUpdateInterface()(
                withDisplayMessages()(
                    withInternalChangeHandler()(
                        withFilterProps(defaultFilterProps)(withDataEntryNotesHandler()(Notes))
                    )
                )
            )
        )
    );
    const notesSettings = {
        getComponent: () => noteComponent,
        getComponentProps: props =>
            createComponentProps(props, {
                label: "Comments",
                onAddNote: props.onAddNote,
                id: "comments",
                dataEntryId: props.id,
            }),
        getPropName: () => "note",
        getValidatorContainers: () => getNoteValidatorContainers(),
        getMeta: () => ({
            placement: placements.BOTTOM,
            section: dataEntrySectionNames.COMMENTS,
        }),
    };

    return notesSettings;
};

const buildAssigneeSettingsFn = () => {
    const assigneeComponent = withTransformPropName(["onBlur", "onSet"])(
        withFocusSaver()(
            withFilterProps(props => {
                const defaultFiltred = defaultFilterProps(props);
                const { validationAttempted, touched, ...passOnProps } = defaultFiltred;
                return passOnProps;
            })(Assignee)
        )
    );

    return {
        isApplicable: props => {
            const enableUserAssignment = props.stage && props.stage.enableUserAssignment;
            return !!enableUserAssignment;
        },
        getComponent: () => assigneeComponent,
        getComponentProps: props =>
            createComponentProps(
                {},
                {
                    orientation: getOrientation(props.formHorizontal),
                }
            ),
        getPropName: () => "assignee",
        getValidatorContainers: () => [],
        getMeta: () => ({
            section: dataEntrySectionNames.ASSIGNEE,
        }),
    };
};

const dataEntryFilterProps = props => {
    const { stage, onScrollToRelationships, recentlyAddedRelationshipId, relationshipsRef, ...passOnProps } =
        props;
    return passOnProps;
};

const WrappedDataEntry = compose(
    withDataEntryField(buildReportDateSettingsFn()),
    withDataEntryFieldIfApplicable(buildGeometrySettingsFn()),
    withDataEntryField(buildNotesSettingsFn()),
    withDataEntryFieldIfApplicable(buildAssigneeSettingsFn()),
    withCleanUp(),
    withFilterProps(dataEntryFilterProps)
)(DataEntryContainer);

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
    [dataEntrySectionNames.RELATIONSHIPS]: {
        placement: placements.BOTTOM,
        name: i18n.t("Relationships"),
    },
    [dataEntrySectionNames.ASSIGNEE]: {
        placement: placements.BOTTOM,
        name: i18n.t("Assignee"),
    },
};
class DataEntryPlain extends Component {
    constructor(props) {
        super(props);
        this.fieldOptions = {
            theme: props.theme,
            fieldLabelMediaBasedClass: props.classes.fieldLabelMediaBased,
        };
        this.dataEntrySections = dataEntrySectionDefinitions;
    }

    UNSAFE_componentWillMount() {
        this.props.onSetSaveTypes(null);
    }

    componentDidMount() {
        if (this.relationshipsInstance && this.props.recentlyAddedRelationshipId) {
            this.relationshipsInstance.scrollIntoView();
            // $FlowFixMe[prop-missing] automated comment
            this.props.onScrollToRelationships();
        }
    }

    componentWillUnmount() {
        inMemoryFileStore.clear();
    }

    setRelationshipsInstance = instance => {
        this.relationshipsInstance = instance;
    };

    render() {
        const {
            onUpdateField,
            onStartAsyncUpdateField,
            classes,
            onSave,
            onSetSaveTypes,
            theme,
            id,
            ...passOnProps
        } = this.props;
        return (
            <div data-test="new-enrollment-event-form">
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <WrappedDataEntry
                    id={id}
                    onUpdateFormField={onUpdateField}
                    onUpdateFormFieldAsync={onStartAsyncUpdateField}
                    fieldOptions={this.fieldOptions}
                    dataEntrySections={this.dataEntrySections}
                    relationshipsRef={this.setRelationshipsInstance}
                    {...passOnProps}
                />
            </div>
        );
    }
}

export const DataEntryComponent = withStyles(getStyles)(withTheme()(DataEntryPlain));
