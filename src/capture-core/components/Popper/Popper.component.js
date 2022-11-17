//
import * as React from "react";
import { Manager, Popper, Reference } from "react-popper";

import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Grow from "@material-ui/core/Grow";

export class MenuPopper extends React.Component {
    static defaultProps = {
        placement: "bottom-end",
    };

    constructor(props) {
        super(props);
        this.state = { popperOpen: false };
    }

    handleReferenceInstanceRetrieved = instance => {
        this.managerRef(instance);
        this.menuReferenceInstance = instance;
    };

    toggleMenu = event => {
        this.setState({
            popperOpen: !this.state.popperOpen,
        });
        event && event.stopPropagation();
    };

    closeMenu = () => {
        this.setState({
            popperOpen: false,
        });
    };

    handleClickAway = event => {
        if (this.menuReferenceInstance && this.menuReferenceInstance.contains(event.target)) {
            return;
        }
        this.closeMenu();
    };

    render() {
        const { classes, getPopperAction, getPopperContent } = this.props;

        return (
            <Manager>
                <Reference>
                    {({ ref }) => {
                        this.managerRef = ref;
                        return (
                            <div ref={this.handleReferenceInstanceRetrieved}>
                                {getPopperAction(this.toggleMenu)}
                            </div>
                        );
                    }}
                </Reference>
                {this.state.popperOpen && (
                    <Popper placement={this.props.placement}>
                        {({ ref, style, placement }) => (
                            <div
                                ref={ref}
                                style={{ ...style, zIndex: 1 }}
                                className={classes ? classes.popperContainer : ""}
                                data-placement={placement}
                            >
                                <ClickAwayListener onClickAway={this.handleClickAway}>
                                    <Grow
                                        in={!!this.state.popperOpen}
                                        id="menu-list-grow"
                                        style={{ transformOrigin: "0 0 0" }}
                                        timeout={{ exit: 0, enter: 200 }}
                                    >
                                        <React.Fragment>{getPopperContent(this.toggleMenu)}</React.Fragment>
                                    </Grow>
                                </ClickAwayListener>
                            </div>
                        )}
                    </Popper>
                )}
            </Manager>
        );
    }
}
