//
import {} from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import i18n from "@dhis2/d2-i18n";
import { ReviewDialogContentsComponent } from "./ReviewDialogContents.component";
import { withLoadingIndicator } from "../../../HOC/withLoadingIndicator";
import { withErrorMessageHandler } from "../../../HOC/withErrorMessageHandler";

import { getAttributesFromScopeId } from "../../../metaData/helpers";

const buildDataElements = scopeId => {
    const currentSearchScopeDataElements = getAttributesFromScopeId(scopeId);

    return currentSearchScopeDataElements
        .filter(({ displayInReports }) => displayInReports)
        .map(({ id, name, type }) => ({ id, name, type }));
};

const mapStateToProps = ({ possibleDuplicates }, { selectedScopeId }) => ({
    ready: !possibleDuplicates.isLoading,
    isUpdating: possibleDuplicates.isUpdating,
    error: possibleDuplicates.loadError ? i18n.t("An error occurred loading possible duplicates") : null,
    teis: possibleDuplicates.teis,
    dataElements: buildDataElements(selectedScopeId),
});

const mapDispatchToProps = () => ({});

export const ReviewDialogContents = compose(
    connect(mapStateToProps, mapDispatchToProps),
    withLoadingIndicator(
        () => ({ padding: "100px 0" }),
        null,
        props => !props.isUpdating && props.ready
    ),
    withErrorMessageHandler()
)(ReviewDialogContentsComponent);
