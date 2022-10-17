//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import i18n from "@dhis2/d2-i18n";
import { LinkButton } from "../../../../../Buttons/LinkButton.component";
import { ProgramFilterer } from "../../../../../ProgramFilterer";

import { TrackerProgram } from "../../../../../../metaData";
import {
    VirtualizedSelectField,
    withSelectTranslations,
    withFocusSaver,
    withDefaultFieldContainer,
    withLabel,
    withFilterProps,
} from "../../../../../FormFields/New";
import { NonBundledDhis2Icon } from "../../../../../NonBundledDhis2Icon";

const getStyles = theme => ({
    iconContainer: {
        display: "flex",
        alignItems: "center",
        paddingRight: 5,
    },
    icon: {
        width: 22,
        height: 22,
        borderRadius: 2,
    },
    isFilteredContainer: {
        fontSize: 12,
        color: theme.palette.grey.dark,
        paddingTop: 5,
    },
    isFilteredLink: {
        paddingLeft: 2,
        backgroundColor: "inherit",
    },
});

class ProgramSelector extends React.Component {
    baseLineFilter = program => {
        const { trackedEntityTypeId } = this.props;

        return (
            program instanceof TrackerProgram &&
            program.trackedEntityType.id === trackedEntityTypeId &&
            program.access.data.write
        );
    };

    getOptionsFromPrograms = programs =>
        programs.map(program => ({
            label: program.name,
            value: program.id,
            iconLeft: this.getProgramIcon(program),
        }));

    getProgramIcon({ icon: { color, name } = {}, name: programName }) {
        const { classes } = this.props;

        return (
            <div className={classes.iconContainer}>
                <NonBundledDhis2Icon
                    name={name || "clinical_fe_outline"}
                    color={color || "#e0e0e0"}
                    alternativeText={programName}
                    width={22}
                    height={22}
                    cornerRadius={2}
                />
            </div>
        );
    }

    renderIsFilteredText() {
        const { classes, onClearFilter } = this.props;
        return (
            <div className={classes.isFilteredContainer}>
                {i18n.t("Some programs are being filtered.")}
                <LinkButton className={classes.isFilteredLink} onClick={onClearFilter}>
                    {i18n.t("Show all")}
                </LinkButton>
            </div>
        );
    }

    render() {
        const { classes, orgUnitIds, onUpdateSelectedProgram, onClearFilter, ...passOnProps } = this.props;
        return (
            <ProgramFilterer orgUnitIds={orgUnitIds} baselineFilter={this.baseLineFilter}>
                {(programs, isFiltered) => (
                    <div>
                        {/* $FlowFixMe[cannot-spread-inexact] automated
                         * comment */}
                        <VirtualizedSelectField
                            options={this.getOptionsFromPrograms(programs)}
                            required={false}
                            onSelect={onUpdateSelectedProgram}
                            {...passOnProps}
                        />
                        {isFiltered ? this.renderIsFilteredText() : null}
                    </div>
                )}
            </ProgramFilterer>
        );
    }
}

export const ComposedProgramSelector = withFocusSaver()(
    withDefaultFieldContainer()(
        withLabel({
            onGetCustomFieldLabeClass: props => props.programLabelClass,
        })(
            withFilterProps(props => {
                const { programLabelClass, ...passOnProps } = props;
                return passOnProps;
            })(withSelectTranslations()(withStyles(getStyles)(ProgramSelector)))
        )
    )
);
