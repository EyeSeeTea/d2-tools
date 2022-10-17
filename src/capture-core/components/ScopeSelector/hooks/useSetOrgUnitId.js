//
import { useHistory, useLocation } from "react-router-dom";
import { getUrlQueries } from "../../../utils/url";
import { buildUrlQueryString } from "../../../utils/routing";

export const useSetOrgUnitId = () => {
    const history = useHistory();
    const { pathname } = useLocation();

    const setOrgUnitId = (orgUnitId, pageToPush = pathname, withRestOfQueries = true) => {
        const restOfQueries = getUrlQueries();
        withRestOfQueries
            ? history.push(`${pageToPush}?${buildUrlQueryString({ ...restOfQueries, orgUnitId })}`)
            : history.push(`${pageToPush}?${buildUrlQueryString({ orgUnitId })}`);
    };

    return { setOrgUnitId };
};
