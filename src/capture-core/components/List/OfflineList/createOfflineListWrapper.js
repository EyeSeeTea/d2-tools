//
import React from "react";
import { OfflineList } from "./OfflineList.component";
import { OfflineEmptyList } from "./OfflineEmptyList.component";

export const createOfflineListWrapper = OfflineListContainerCreator => {
    const OfflineListContainer = OfflineListContainerCreator
        ? OfflineListContainerCreator(OfflineList)
        : OfflineList;

    const OfflineListWrapper = props => {
        const { hasData, ...passOnProps } = props;
        if (!hasData) {
            return <OfflineEmptyList />;
        }

        return <OfflineListContainer {...passOnProps} />;
    };
    return OfflineListWrapper;
};
