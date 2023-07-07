//
import React, { useMemo } from "react";
import { scopeTypes } from "../../../../../metaData";
import { PossibleDuplicatesDialog } from "../../../../PossibleDuplicatesDialog";
import { useDuplicateCheckerOnSaveReduxProvider } from "./useDuplicateCheckerOnSaveReduxProvider";
import { useDuplicateCheckerOnSave } from "./useDuplicateCheckerOnSave";

const getMetadataInfo = (enrollmentMetadata, teiRegistrationMetadata) => {
    if (enrollmentMetadata) {
        return {
            metadata: enrollmentMetadata,
            scopeType: scopeTypes.TRACKER_PROGRAM,
            passOnMetadata: {
                enrollmentMetadata,
            },
        };
    }

    return {
        metadata: teiRegistrationMetadata,
        scopeType: scopeTypes.TRACKED_ENTITY_TYPE,
        passOnMetadata: {
            teiRegistrationMetadata,
        },
    };
};

export const withDuplicateCheckOnSave =
    () =>
    WrappedComponent =>
    ({
        id,
        selectedScopeId,
        onSave,
        enrollmentMetadata,
        teiRegistrationMetadata,
        duplicatesReviewPageSize,
        renderDuplicatesCardActions,
        renderDuplicatesDialogActions,
        skipDuplicateCheck,
        ...passOnProps
    }) => {
        const { metadata, scopeType, passOnMetadata } = getMetadataInfo(
            enrollmentMetadata,
            teiRegistrationMetadata
        );

        const { onCheckForDuplicate, onResetCheckForDuplicate, duplicateInfo, onReviewDuplicates } =
            useDuplicateCheckerOnSaveReduxProvider(id, selectedScopeId);

        const { handleSaveAttempt, duplicatesVisible, closeDuplicates } = useDuplicateCheckerOnSave({
            onSave,
            duplicateInfo,
            onCheckForDuplicate,
            onResetCheckForDuplicate,
            onReviewDuplicates,
            searchGroup: metadata?.inputSearchGroups && metadata.inputSearchGroups[0],
            scopeType,
            selectedScopeId,
            duplicatesReviewPageSize,
        });

        const duplicatesDialogActions = useMemo(
            () => renderDuplicatesDialogActions && renderDuplicatesDialogActions(closeDuplicates, onSave),
            [renderDuplicatesDialogActions, closeDuplicates, onSave]
        );

        return (
            <>
                <WrappedComponent
                    {...passOnProps}
                    {...passOnMetadata}
                    onSave={skipDuplicateCheck ? onSave : handleSaveAttempt}
                    id={id}
                    selectedScopeId={selectedScopeId}
                />
                <PossibleDuplicatesDialog
                    dataEntryId={id}
                    selectedScopeId={selectedScopeId}
                    open={duplicatesVisible}
                    onCancel={closeDuplicates}
                    renderCardActions={renderDuplicatesCardActions}
                    extraActions={duplicatesDialogActions}
                />
            </>
        );
    };
