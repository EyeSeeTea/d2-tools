//
import * as React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import { RelationshipTypeSelector } from "./RelationshipTypeSelector/RelationshipTypeSelector.component";
import { TeiRelationship } from "./TeiRelationship/TeiRelationship.component";

import { RelationshipNavigation } from "./RelationshipNavigation/RelationshipNavigation.container";

const getStyles = () => ({
    container: {},
});

const relationshipComponentByEntityType = {
    TRACKED_ENTITY_INSTANCE: TeiRelationship,
};

class NewRelationshipPlain extends React.Component {
    renderRelationship = (selectedRelationshipType, props) => {
        const RelationshipComponent = relationshipComponentByEntityType[selectedRelationshipType.to.entity];
        return <RelationshipComponent onAddRelationship={this.handleAddRelationship} {...props} />;
    };

    handleAddRelationship = entity => {
        const relationshipType = this.props.selectedRelationshipType;
        if (!relationshipType) {
            return;
        }

        this.props.onAddRelationship(
            { id: relationshipType.id, name: relationshipType.name },
            entity,
            relationshipType.to.entity
        );
    };

    render() {
        const { classes, onAddRelationship, ...passOnProps } = this.props;
        const selectedRelationshipType = this.props.selectedRelationshipType;
        return (
            <div className={this.props.classes.container}>
                <RelationshipNavigation {...passOnProps} />
                {!selectedRelationshipType && <RelationshipTypeSelector {...passOnProps} />}
                {selectedRelationshipType && this.renderRelationship(selectedRelationshipType, passOnProps)}
            </div>
        );
    }
}

export const NewRelationshipComponent = withStyles(getStyles)(NewRelationshipPlain);
