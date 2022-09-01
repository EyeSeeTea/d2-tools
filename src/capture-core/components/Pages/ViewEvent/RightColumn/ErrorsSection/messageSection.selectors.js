//
import { createSelector } from "reselect";

const containerSelector = data => data.messagesContainer;
const mainPropNameSelector = data => data.containerPropNameMain;
const onCompletePropNameSelector = data => data.containerPropNameOnComplete;
const showOnCompleteSelector = data => data.showOnComplete;

// $FlowFixMe
export const makeGetVisibleMessages = () =>
    createSelector(
        containerSelector,
        showOnCompleteSelector,
        mainPropNameSelector,
        onCompletePropNameSelector,
        (container, showOnComplete, mainPropName, onCompletePropName) => {
            container = container || {};
            if (!showOnComplete) {
                return container[mainPropName];
            }

            const main = container[mainPropName] || [];
            const onComplete = container[onCompletePropName] || [];

            return [...main, ...onComplete];
        }
    );
