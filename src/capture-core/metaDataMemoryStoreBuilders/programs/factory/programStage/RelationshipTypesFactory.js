//
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

import { RelationshipType } from "../../../../metaData";

export class RelationshipTypesFactory {
    static RELATIONSHIP_ENTITY_NAME = "PROGRAM_STAGE_INSTANCE";

    constructor(cachedRelationshipTypes) {
        this.cachedRelationshipTypes = cachedRelationshipTypes;
    }

    _relationshipConstraintIsStage(constraint) {
        return (
            constraint.relationshipEntity === RelationshipTypesFactory.RELATIONSHIP_ENTITY_NAME &&
            ((!constraint.programStage &&
                constraint.program &&
                constraint.program.id === this.currentProgramId) ||
                (constraint.programStage && constraint.programStage.id === this.currentProgramStageId))
        );
    }

    _convertConstraint(constraint) {
        const convertedConstraint = {
            entity: constraint.relationshipEntity,
            programId: constraint.program ? constraint.program.id : null,
            programStageId: constraint.programStage ? constraint.programStage.id : null,
            trackedEntityTypeId: constraint.trackedEntityType ? constraint.trackedEntityType.id : null,
        };
        if (!convertedConstraint.programStageId && this._relationshipConstraintIsStage(constraint)) {
            convertedConstraint.programStageId = this.currentProgramStageId;
        }
        return convertedConstraint;
    }

    _buildRelationshipType(cachedRelationshipType) {
        return new RelationshipType(o => {
            o.id = cachedRelationshipType.id;
            o.name = cachedRelationshipType.displayName;
            // $FlowFixMe[incompatible-type] automated comment
            o.from = this._convertConstraint(cachedRelationshipType.fromConstraint);
            o.to = this._convertConstraint(cachedRelationshipType.toConstraint);
            o.access = cachedRelationshipType.access;
        });
    }

    build(programId, programStageId) {
        this.currentProgramId = programId;
        this.currentProgramStageId = programStageId;

        const filteredRelationshipTypes = this.cachedRelationshipTypes.filter(
            rt =>
                rt.access.data.read &&
                (this._relationshipConstraintIsStage(rt.fromConstraint) ||
                    this._relationshipConstraintIsStage(rt.toConstraint))
        );

        return filteredRelationshipTypes.map(rt => this._buildRelationshipType(rt));
    }
}
