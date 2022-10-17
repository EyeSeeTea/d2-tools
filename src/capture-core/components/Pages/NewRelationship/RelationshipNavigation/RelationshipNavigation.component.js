//

import * as React from "react";
import I18n from "@dhis2/d2-i18n";

import { LinkButton } from "../../../Buttons/LinkButton.component";
import { findModeDisplayNames } from "../findModes";

export class RelationshipNavigationComponent extends React.Component {
    renderForRelationshipType = selectedRelationshipType => {
        const { onSelectRelationshipType, findMode } = this.props;
        const relationshipTypeName = selectedRelationshipType.name;
        return (
            <React.Fragment>
                {this.renderSlash()}
                {findMode ? (
                    <React.Fragment>
                        <LinkButton onClick={() => onSelectRelationshipType(selectedRelationshipType)}>
                            {relationshipTypeName}
                        </LinkButton>
                        {this.renderForFindMode(findMode)}
                    </React.Fragment>
                ) : (
                    relationshipTypeName
                )}
            </React.Fragment>
        );
    };

    renderSlash = () => <span style={{ padding: 5 }}>/</span>;

    renderForFindMode = findMode => {
        const { onSelectFindMode, searching } = this.props;
        const displayName = findModeDisplayNames[findMode];
        return (
            <React.Fragment>
                {this.renderSlash()}
                {searching ? (
                    <React.Fragment>
                        <LinkButton onClick={() => onSelectFindMode(findMode)}>{displayName}</LinkButton>
                        {this.renderForSearching()}
                    </React.Fragment>
                ) : (
                    displayName
                )}
            </React.Fragment>
        );
    };

    renderForSearching = () => (
        <React.Fragment>
            {this.renderSlash()}
            {I18n.t("Search results")}
        </React.Fragment>
    );

    render() {
        const { selectedRelationshipType, onInitializeNewRelationship, header } = this.props;
        return (
            <div style={{ padding: 10 }}>
                {selectedRelationshipType ? (
                    <React.Fragment>
                        <LinkButton onClick={onInitializeNewRelationship}>{header}</LinkButton>
                        {this.renderForRelationshipType(selectedRelationshipType)}
                    </React.Fragment>
                ) : (
                    header
                )}
            </div>
        );
    }
}
