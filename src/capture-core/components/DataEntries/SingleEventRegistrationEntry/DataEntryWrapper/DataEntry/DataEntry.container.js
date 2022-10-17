//
import uuid from "uuid/v4";
import { connect } from "react-redux";
import i18n from "@dhis2/d2-i18n";
import { batchActions } from "redux-batched-actions";
import {} from "capture-core-utils/rulesEngine";
import { DataEntryComponent } from "./DataEntry.component";
import { startRunRulesPostUpdateField } from "../../../../DataEntry";
import {
    startAsyncUpdateFieldForNewEvent,
    startRunRulesOnUpdateForNewSingleEvent,
    requestSaveNewEventAndReturnToMainPage,
    cancelNewEventAndReturnToMainPage,
    batchActionTypes,
    requestSaveNewEventAddAnother,
    setNewEventSaveTypes,
    addNewEventNote,
    newEventOpenNewRelationship,
    scrolledToRelationships,
    requestSaveNewEventInStage,
} from "./actions/dataEntry.actions";
import { makeProgramNameSelector } from "./dataEntry.selectors";
import {} from "../../../../../metaData";
import { withLoadingIndicator, withErrorMessageHandler } from "../../../../../HOC";

const makeMapStateToProps = () => {
    const programNameSelector = makeProgramNameSelector();

    const mapStateToProps = (state, props) => ({
        recentlyAddedRelationshipId: state.newEventPage.recentlyAddedRelationshipId,
        ready: !state.activePage.isDataEntryLoading,
        error: !props.formFoundation
            ? i18n.t("This is not an event program or the metadata is corrupt. See log for details.")
            : null,
        programName: programNameSelector(state),
        orgUnitName:
            state.organisationUnits[state.currentSelections.orgUnitId] &&
            state.organisationUnits[state.currentSelections.orgUnitId].name,
    });

    // $FlowFixMe[not-an-object] automated comment
    return mapStateToProps;
};

const mapDispatchToProps = dispatch => ({
    onUpdateDataEntryField: orgUnit => innerAction => {
        const { dataEntryId, itemId } = innerAction.payload;
        const uid = uuid();

        dispatch(
            batchActions(
                [
                    innerAction,
                    startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                    startRunRulesOnUpdateForNewSingleEvent({ ...innerAction.payload, uid, orgUnit }),
                ],
                batchActionTypes.UPDATE_DATA_ENTRY_FIELD_NEW_SINGLE_EVENT_ACTION_BATCH
            )
        );
    },
    onUpdateField: orgUnit => innerAction => {
        const { dataEntryId, itemId } = innerAction.payload;
        const uid = uuid();

        dispatch(
            batchActions(
                [
                    innerAction,
                    startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                    startRunRulesOnUpdateForNewSingleEvent({ ...innerAction.payload, uid, orgUnit }),
                ],
                batchActionTypes.UPDATE_FIELD_NEW_SINGLE_EVENT_ACTION_BATCH
            )
        );
    },
    onStartAsyncUpdateField: orgUnit => (innerAction, dataEntryId, itemId) => {
        const onAsyncUpdateSuccess = successInnerAction => {
            const uid = uuid();
            return batchActions(
                [
                    successInnerAction,
                    startRunRulesPostUpdateField(dataEntryId, itemId, uid),
                    startRunRulesOnUpdateForNewSingleEvent({
                        ...successInnerAction.payload,
                        dataEntryId,
                        itemId,
                        uid,
                        orgUnit,
                    }),
                ],
                batchActionTypes.UPDATE_FIELD_NEW_SINGLE_EVENT_ACTION_BATCH
            );
        };
        const onAsyncUpdateError = errorInnerAction => errorInnerAction;

        dispatch(startAsyncUpdateFieldForNewEvent(innerAction, onAsyncUpdateSuccess, onAsyncUpdateError));
    },
    onSave: (eventId, dataEntryId, formFoundation) => {
        window.scrollTo(0, 0);
        dispatch(requestSaveNewEventAndReturnToMainPage(eventId, dataEntryId, formFoundation));
    },
    onAddNote: (itemId, dataEntryId, note) => {
        dispatch(addNewEventNote(itemId, dataEntryId, note));
    },
    onSetSaveTypes: newSaveTypes => {
        dispatch(setNewEventSaveTypes(newSaveTypes));
    },
    onSaveAndAddAnother: (eventId, dataEntryId, formFoundation) => {
        dispatch(requestSaveNewEventAddAnother(eventId, dataEntryId, formFoundation));
    },
    onCancel: () => {
        window.scrollTo(0, 0);
        dispatch(cancelNewEventAndReturnToMainPage());
    },
    onOpenAddRelationship: (eventId, dataEntryId) => {
        dispatch(newEventOpenNewRelationship(eventId, dataEntryId));
    },
    onScrollToRelationships: () => {
        dispatch(scrolledToRelationships());
    },
    onSaveEventInStage: (eventId, dataEntryId, formFoundation, completed) => {
        window.scrollTo(0, 0);
        dispatch(requestSaveNewEventInStage(eventId, dataEntryId, formFoundation, completed));
    },
});

// $FlowFixMe[missing-annot] automated comment
export const DataEntry = connect(
    makeMapStateToProps,
    mapDispatchToProps
)(withLoadingIndicator()(withErrorMessageHandler()(DataEntryComponent)));
