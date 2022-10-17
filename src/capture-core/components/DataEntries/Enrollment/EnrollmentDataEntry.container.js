//

import { connect } from "react-redux";
import {
    updateFieldBatch,
    asyncUpdateSuccessBatch,
    updateDataEntryFieldBatch,
} from "./actions/enrollment.actionBatchs";
import { startAsyncUpdateFieldForNewEnrollment } from "./actions/enrollment.actions";
import { EnrollmentDataEntryComponent } from "./EnrollmentDataEntry.component";

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onUpdateDataEntryField: (innerAction, data, programId, orgUnit) => {
        dispatch(updateDataEntryFieldBatch(innerAction, programId, orgUnit));
    },
    onUpdateField: (innerAction, programId, orgUnit) => {
        dispatch(updateFieldBatch(innerAction, programId, orgUnit));
    },
    onStartAsyncUpdateField: (innerAction, dataEntryId, itemId, programId, orgUnit) => {
        const onAsyncUpdateSuccess = successInnerAction =>
            asyncUpdateSuccessBatch(successInnerAction, dataEntryId, itemId, programId, orgUnit);
        const onAsyncUpdateError = errorInnerAction => errorInnerAction;

        dispatch(
            startAsyncUpdateFieldForNewEnrollment(innerAction, onAsyncUpdateSuccess, onAsyncUpdateError)
        );
    },
});

// $FlowFixMe
export const EnrollmentDataEntry = connect(mapStateToProps, mapDispatchToProps)(EnrollmentDataEntryComponent);
