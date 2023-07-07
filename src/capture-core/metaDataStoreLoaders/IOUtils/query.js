//

import { getContext } from "../context";

export const query = (resourceQuery, variables) => {
    const { onQueryApi } = getContext();
    return onQueryApi(resourceQuery, variables);
};
