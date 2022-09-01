//
import { connect } from "react-redux";
import { updateFieldBatch, asyncUpdateSuccessBatch } from "./actions/tei.actionBatches";
import { startAsyncUpdateFieldForNewTei } from "./actions/tei.actions";
import { PreTeiDataEntry } from "./TrackedEntityInstanceDataEntry.component";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onUpdateField: innerAction => {
        dispatch(updateFieldBatch(innerAction));
    },
    onStartAsyncUpdateField: innerAction => {
        const onAsyncUpdateSuccess = successInnerAction => asyncUpdateSuccessBatch(successInnerAction);
        const onAsyncUpdateError = errorInnerAction => errorInnerAction;

        dispatch(startAsyncUpdateFieldForNewTei(innerAction, onAsyncUpdateSuccess, onAsyncUpdateError));
    },
});

// $FlowFixMe
export const TrackedEntityInstanceDataEntry = connect(mapStateToProps, mapDispatchToProps)(PreTeiDataEntry);
