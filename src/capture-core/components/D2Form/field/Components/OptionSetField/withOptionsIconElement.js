//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { NonBundledDhis2Icon } from "../../../../NonBundledDhis2Icon";

const getStyles = () => ({
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
});

/**
 * Converts icon objects in options to React nodes, with property key iconRight.
 */

export const withOptionsIconElement = () => InnerComponent =>
    withStyles(getStyles)(
        class CreateOptionsIconElementHOC extends React.Component {
            constructor(props) {
                super(props);
                // $FlowFixMe
                this.options = this.getOptions();
            }

            getIcon(icon) {
                const { label, classes } = this.props;
                return icon ? (
                    <div className={classes.iconContainer}>
                        <NonBundledDhis2Icon
                            name={icon.name}
                            color={icon.color}
                            width={22}
                            height={22}
                            cornerRadius={2}
                            alternativeText={label || undefined}
                        />
                    </div>
                ) : null;
            }

            getOptions() {
                const { options } = this.props;
                return options.map(option => ({
                    ...option,
                    iconRight: this.getIcon(option.icon),
                    iconLeft: null,
                }));
            }

            render() {
                const { options, classes, ...passOnProps } = this.props;

                return (
                    // $FlowFixMe[cannot-spread-inexact] automated comment
                    <InnerComponent options={this.options} {...passOnProps} />
                );
            }
        }
    );
