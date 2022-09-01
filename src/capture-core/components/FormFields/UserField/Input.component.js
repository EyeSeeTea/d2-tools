//
import * as React from "react";
import i18n from "@dhis2/d2-i18n";
import { DebounceField, withTextFieldFocusHandler, withFocusSaver } from "capture-ui";
import { SearchContext } from "./Search.context";

const FocusableDebounceField = withFocusSaver()(withTextFieldFocusHandler()(DebounceField));

const isSuggestionBlurTarget = (target, suggestionName) => {
    if (target.getAttribute("name") === suggestionName) {
        return true;
    }

    const parentElement = target.parentElement;
    if (!parentElement) {
        return false;
    }

    return parentElement.getAttribute("name") === suggestionName;
};

export const Input = props => {
    const {
        onUpdateValue,
        onHighlightSuggestion,
        onSelectSuggestion,
        onResetDisplayedHighlight,
        onExitSearch,
        inputWrapperClasses,
        inputDomRef,
        useUpwardList,
        placeholder,
        ...passOnProps
    } = props;

    const { inputName, suggestionName } = React.useContext(SearchContext);

    const handleUpdateValue = React.useCallback(
        event => onUpdateValue(event.currentTarget.value),
        [onUpdateValue]
    );

    // eslint-disable-next-line complexity
    const handleKeyDown = React.useCallback(
        event => {
            if ((event.keyCode === 40 && !useUpwardList) || (event.keyCode === 38 && useUpwardList)) {
                onHighlightSuggestion();
                event.stopPropagation();
                event.preventDefault();
            } else if (event.keyCode === 13) {
                onSelectSuggestion();
            }
        },
        [onHighlightSuggestion, onSelectSuggestion, useUpwardList]
    );
    const handleBlur = React.useCallback(
        event => {
            if (!event.relatedTarget || !isSuggestionBlurTarget(event.relatedTarget, suggestionName)) {
                onExitSearch();
            }
        },
        [onExitSearch, suggestionName]
    );

    return (
        // $FlowFixMe[cannot-spread-inexact] automated comment
        <FocusableDebounceField
            name={inputName}
            inputRef={inputDomRef}
            onDebounced={handleUpdateValue}
            onFocus={onResetDisplayedHighlight}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            classes={inputWrapperClasses}
            placeholder={placeholder !== undefined ? placeholder : i18n.t("start typing to search")}
            {...passOnProps}
        />
    );
};
