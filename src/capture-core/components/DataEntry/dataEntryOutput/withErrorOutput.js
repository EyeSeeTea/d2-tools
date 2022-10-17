//
import * as React from "react";
import { connect } from "react-redux";
import Card from "@material-ui/core/Card";
import { IconErrorFilled16 } from "@dhis2/ui";
import { withStyles } from "@material-ui/core/styles";
import i18n from "@dhis2/d2-i18n";
import { getDataEntryKey } from "../common/getDataEntryKey";
import { withDataEntryOutput } from "./withDataEntryOutput";

const styles = theme => ({
    card: {
        padding: theme.typography.pxToRem(10),
        backgroundColor: theme.palette.error.red200,
        borderRadius: theme.typography.pxToRem(5),
    },
    list: {
        margin: 0,
    },
    listItem: {
        paddingLeft: theme.typography.pxToRem(10),
        marginTop: theme.typography.pxToRem(8),
    },
    header: {
        color: "#902c02",
        display: "flex",
        alignItems: "center",
    },
    headerText: {
        marginLeft: theme.typography.pxToRem(10),
    },
});

const getErrorOutput = () =>
    class ErrorOutputBuilder extends React.Component {
        static renderErrorItems = (errorItems, classes) => (
            <div>
                {errorItems.map(item => (
                    <li key={item.id} className={classes.listItem}>
                        <p>{item.message}</p>
                    </li>
                ))}
            </div>
        );

        constructor(props) {
            super(props);
            this.name = "ErrorOutputBuilder";
        }

        getVisibleErrorItems() {
            const { errorItems, errorOnCompleteItems, saveAttempted } = this.props;
            if (saveAttempted) {
                const errorItemsNoNull = errorItems || [];
                const errorOnCompleteItemsNoNull = errorOnCompleteItems || [];
                return [...errorItemsNoNull, ...errorOnCompleteItemsNoNull];
            }

            return errorItems || [];
        }

        render = () => {
            const { classes } = this.props;
            const visibleItems = this.getVisibleErrorItems();
            return (
                <div>
                    {visibleItems && visibleItems.length > 0 && (
                        <Card className={classes.card}>
                            <div className={classes.header}>
                                <IconErrorFilled16 />
                                <div className={classes.headerText}>{i18n.t("Errors")}</div>
                            </div>
                            <ul className={classes.list}>
                                {ErrorOutputBuilder.renderErrorItems(visibleItems, classes)}
                            </ul>
                        </Card>
                    )}
                </div>
            );
        };
    };

const mapStateToProps = (state, props) => {
    const itemId = state.dataEntries[props.id].itemId;
    const key = getDataEntryKey(props.id, itemId);
    return {
        errorItems: state.rulesEffectsGeneralErrors[key] ? state.rulesEffectsGeneralErrors[key].error : null,
        errorOnCompleteItems: state.rulesEffectsGeneralErrors[key]
            ? state.rulesEffectsGeneralErrors[key].errorOnComplete
            : null,
    };
};

const mapDispatchToProps = () => ({});

export const withErrorOutput = () => InnerComponent =>
    withDataEntryOutput()(
        InnerComponent,
        withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(getErrorOutput()))
    );
