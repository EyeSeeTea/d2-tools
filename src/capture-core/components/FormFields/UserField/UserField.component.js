//
import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { UserSearch } from "./UserSearch.component";
import { Selected } from "./Selected.component";

const getStyles = theme => ({
    inputWrapperFocused: {
        border: `2px solid ${theme.palette.primary.light}`,
        borderRadius: "5px",
    },
    inputWrapperUnfocused: {
        padding: 2,
    },
});

const UserFieldPlain = props => {
    const {
        classes,
        value,
        onSet,
        useUpwardSuggestions,
        focusOnMount = false,
        inputPlaceholderText,
        usernameOnlyMode,
    } = props;
    const focusSearchInput = React.useRef(focusOnMount);
    const focusSelectedInput = React.useRef(focusOnMount);

    React.useEffect(() => {
        if (focusSearchInput) {
            focusSearchInput.current = false;
        }
    });

    React.useEffect(() => {
        if (focusSelectedInput) {
            focusSelectedInput.current = false;
        }
    });

    const handleClear = () => {
        onSet();
        focusSearchInput.current = true;
    };

    const handleSet = user => {
        onSet(usernameOnlyMode ? user.username : user);
        focusSelectedInput.current = true;
    };

    if (value) {
        return (
            <Selected
                // $FlowFixMe
                text={usernameOnlyMode ? value : value.name}
                onClear={handleClear}
                // $FlowFixMe[incompatible-type] automated comment
                focusInputOnMount={focusSelectedInput.current}
            />
        );
    }

    return (
        <div>
            <UserSearch
                onSet={handleSet}
                inputWrapperClasses={classes}
                // $FlowFixMe[incompatible-type] automated comment
                focusInputOnMount={focusSearchInput.current}
                useUpwardList={useUpwardSuggestions}
                inputPlaceholderText={inputPlaceholderText}
                exitBehaviour="selectBestChoice"
            />
        </div>
    );
};

export const UserField = withStyles(getStyles)(UserFieldPlain);
