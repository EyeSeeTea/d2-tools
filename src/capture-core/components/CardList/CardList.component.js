//
import React from "react";

import { withStyles } from "@material-ui/core";
import { CardListItem } from "./CardListItem.component";
import { makeElementsContainerSelector } from "./CardList.selectors";

const getStyles = theme => ({
    noItemsContainer: {
        fontStyle: "italic",
        padding: theme.typography.pxToRem(10),
    },
});

const CardListIndex = ({
    classes,
    items,
    renderCustomCardActions,
    dataElements,
    noItemsText,
    currentProgramId,
    currentSearchScopeName,
}) => {
    const { profileImageDataElement, dataElementsExceptProfileImage } =
        makeElementsContainerSelector()(dataElements);
    return (
        <div data-test="search-results-list">
            {!items || items.length === 0 ? (
                <div className={classes.noItemsContainer}>{noItemsText}</div>
            ) : (
                items.map(item => (
                    <CardListItem
                        key={item.id}
                        item={item}
                        currentSearchScopeName={currentSearchScopeName}
                        currentProgramId={currentProgramId}
                        renderCustomCardActions={renderCustomCardActions}
                        profileImageDataElement={profileImageDataElement}
                        dataElements={dataElementsExceptProfileImage}
                    />
                ))
            )}
        </div>
    );
};

export const CardList = withStyles(getStyles)(CardListIndex);
