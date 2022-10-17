//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { StickyOnScroll } from "../Sticky/StickyOnScroll.component";
import { ErrorsSection } from "./ErrorsSection/ErrorsSection.container";
import { WarningsSection } from "./WarningsSection/WaningsSection.container";
import { FeedbacksSection } from "../Pages/ViewEvent/RightColumn/FeedbacksSection/FeedbacksSection.container";
import { IndicatorsSection } from "../Pages/ViewEvent/RightColumn/IndicatorsSection/IndicatorsSection.container";

const getStyles = theme => ({
    stickyOnScroll: {
        position: "relative",
        flexGrow: 1,
        width: theme.typography.pxToRem(300),
        margin: theme.typography.pxToRem(10),
        marginTop: 0,
    },
});

const componentContainers = [
    { id: "ErrorsSection", Component: ErrorsSection },
    { id: "WarningsSection", Component: WarningsSection },
    { id: "FeedbacksSection", Component: FeedbacksSection },
    { id: "IndicatorsSection", Component: IndicatorsSection },
];

class DataEntryWidgetOutputPlain extends React.Component {
    renderComponent = (container, props) => {
        const { renderCardActions, ...otherProps } = props;

        const passOnProps = container.id === "WarningsSection" ? props : otherProps;
        return <container.Component key={container.id} {...passOnProps} />;
    };

    render() {
        const { classes, ...passOnProps } = this.props;
        return (
            <StickyOnScroll offsetTop={50} containerClass={classes.stickyOnScroll}>
                <div>{componentContainers.map(c => this.renderComponent(c, passOnProps))}</div>
            </StickyOnScroll>
        );
    }
}

export const DataEntryWidgetOutputComponent = withStyles(getStyles)(DataEntryWidgetOutputPlain);
