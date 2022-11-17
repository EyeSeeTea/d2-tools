//
import { useHistory, useLocation } from "react-router-dom";
import { buildUrlQueryString } from "../../../utils/routing";

export const useResetViewEventId = () => {
    const history = useHistory();
    const { pathname } = useLocation();

    const resetViewEventId = (pageToPush = pathname, restOfQueries = {}) => {
        history.push(`${pageToPush}?${buildUrlQueryString({ ...restOfQueries })}`);
    };

    return { resetViewEventId };
};
