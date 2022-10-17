//
import * as React from "react";
import classNames from "classnames";
import i18n from "@dhis2/d2-i18n";
import { withStyles } from "@material-ui/core/styles";
import { withLabel as UIWithLabel } from "capture-ui";
import { NonBundledDhis2Icon } from "../../../NonBundledDhis2Icon";
import { withDescription } from "./withDescription";

const getStyles = theme => ({
    label: {
        color: theme.palette.text.primary,
        paddingBottom: 4,
    },
    labelVertical: {
        color: theme.palette.text.primary,
    },
});

const getStylesLabel = theme => ({
    container: {
        display: "flex",
        alignItems: "center",
    },
    required: {
        color: theme.palette.required,
    },
    iconContainer: {
        paddingLeft: 5,
        display: "flex",
        alignItems: "center",
    },
});

export const withLabel = hocParams => InnerComponent => {
    const onGetUseVerticalOrientation = hocParams && hocParams.onGetUseVerticalOrientation;
    const onGetCustomFieldLabeClass = hocParams && hocParams.onGetCustomFieldLabeClass;

    const LabelHOCWithStyles = UIWithLabel({
        onGetUseVerticalOrientation: props =>
            onGetUseVerticalOrientation && onGetUseVerticalOrientation(props),
        onSplitClasses: (classes, props) => {
            const { label, labelVertical, ...rest } = classes;
            const useVerticalOrientation = onGetUseVerticalOrientation && onGetUseVerticalOrientation(props);
            return {
                labelContainer: null,
                labelClasses: {
                    label: useVerticalOrientation
                        ? labelVertical
                        : classNames(label, onGetCustomFieldLabeClass && onGetCustomFieldLabeClass(props)),
                },
                passOnClasses: rest,
            };
        },
    })(InnerComponent);

    const RequiredLabel = props => (
        <span>
            {props.label}
            <span className={props.requiredClass}>&nbsp;*</span>
        </span>
    );

    const Icon = props => {
        const { icon, label } = props;
        if (!icon) {
            return null;
        }

        return (
            <NonBundledDhis2Icon
                name={icon.name}
                color={icon.color}
                alternativeText={i18n.t("Icon for {{field}}", {
                    field: label || "",
                    interpolation: { escapeValue: false },
                })}
                cornerRadius={2}
                width={22}
                height={22}
            />
        );
    };

    const CalculatedLabel = props => {
        const { label, required } = props;
        return required && label ? <RequiredLabel {...props} /> : label;
    };

    const Label = props => {
        const { label, required, icon, classes, dataElementDescription } = props;
        return (
            <div className={classes.container}>
                <div className={classes.iconContainer}>
                    <Icon icon={icon} label={label} />
                </div>
                <CalculatedLabel label={label || ""} required={required} requiredClass={classes.required} />
                {dataElementDescription}
            </div>
        );
    };
    const LabelWithStyles = withDescription()(withStyles(getStylesLabel)(Label));
    const ProjectLabelHOC = withStyles(getStyles)(props => {
        const { label, required, icon, ...passOnProps } = props;
        const { classes, ...propsWithoutClasses } = props;
        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <LabelHOCWithStyles label={<LabelWithStyles {...propsWithoutClasses} />} {...passOnProps} />
        );
    });

    return ProjectLabelHOC;
};
