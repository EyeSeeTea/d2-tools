//
import { useHistory, useLocation } from "react-router-dom";
import { getUrlQueries } from "../../../utils/url";
import { buildUrlQueryString } from "../../../utils/routing";

export const useResetProgramId = () => {
    const history = useHistory();
    const { pathname } = useLocation();

    const resetProgramId = (pageToPush = pathname) => {
        const { programId, ...restOfQueries } = getUrlQueries();
        history.push(`${pageToPush}?${buildUrlQueryString({ ...restOfQueries })}`);
    };

    const resetProgramIdAndEnrollmentContext = (pageToPush = pathname) => {
        const { programId, enrollmentId, stageId, eventId, ...restOfQueries } = getUrlQueries();
        history.push(`${pageToPush}?${buildUrlQueryString({ ...restOfQueries, enrollmentId: "AUTO" })}`);
    };

    const resetProgramIdAndTeiId = (pageToPush = pathname) => {
        const { programId, teiId, ...restOfQueries } = getUrlQueries();
        history.push(`${pageToPush}?${buildUrlQueryString({ ...restOfQueries })}`);
    };

    return { resetProgramId, resetProgramIdAndEnrollmentContext, resetProgramIdAndTeiId };
};
