//
import * as React from "react";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { IconChevronDown24, IconChevronUp24 } from "@dhis2/ui";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "./ButtonOld.component";
import { ProgressButton } from "./ProgressButton.component";

const styles = () => ({
    buttonsContainer: {
        display: "flex",
        flexDirection: "row",
    },
    arrowButton: {
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 6,
        paddingRight: 6,
        minWidth: 0,
        borderBottomLeftRadius: 0,
        borderTopLeftRadius: 0,
    },
    button: {
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
    },
    menuList: {
        paddingTop: 0,
        paddingBottom: 0,
    },
});

class MultiButtonPlain extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuOpen: false,
            anchorElement: null,
        };
    }

    onMenuItemClick = item => {
        this.toggleMenu();
        item.onClick();
    };

    toggleMenu = () => {
        this.setState({
            menuOpen: !this.state.menuOpen,
            anchorElement: this.buttonInstance,
        });
    };

    renderMenuItems = () =>
        this.props.dropDownItems.map(item => (
            <MenuItem key={item.key} onClick={() => this.onMenuItemClick(item)}>
                {item.text}
            </MenuItem>
        ));

    render() {
        const { classes, color, variant } = this.props;
        const arrowButtonProps = { color, variant, ...this.props.arrowProps };
        const buttonProps = { color, variant, ...this.props.buttonProps };
        return (
            <div>
                <div
                    className={classes.buttonsContainer}
                    ref={buttonInstance => {
                        this.buttonInstance = buttonInstance;
                    }}
                >
                    <div>
                        {this.props.buttonType === "progress" ? (
                            <ProgressButton className={classes.button} {...buttonProps}>
                                {this.props.buttonText}
                            </ProgressButton>
                        ) : (
                            <Button className={classes.button} {...buttonProps}>
                                {this.props.buttonText}
                            </Button>
                        )}
                    </div>
                    <div
                        ref={arrowInstance => {
                            this.arrowInstance = arrowInstance;
                        }}
                    >
                        <Button
                            onClick={this.toggleMenu}
                            className={classes.arrowButton}
                            variant={variant}
                            color={color}
                            {...arrowButtonProps}
                        >
                            {this.state.menuOpen ? <IconChevronUp24 /> : <IconChevronDown24 />}
                        </Button>
                    </div>
                </div>
                <Menu
                    id="simple-menu"
                    anchorEl={this.state.anchorElement}
                    getContentAnchorEl={null}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    elevation={10}
                    open={this.state.menuOpen}
                    onClose={this.toggleMenu}
                    MenuListProps={{ className: classes.menuList }}
                >
                    {this.renderMenuItems()}
                </Menu>
            </div>
        );
    }
}

export const MultiButton = withStyles(styles)(MultiButtonPlain);
