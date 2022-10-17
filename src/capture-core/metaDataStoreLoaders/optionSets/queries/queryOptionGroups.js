//
import { query } from "../../IOUtils";

const querySpecification = {
    resource: "optionGroups",
    params: attributes => ({
        fields: "id,displayName,options[id],optionSet[id]",
        filter: `optionSet.id:in:[${attributes.ids.join(",")}]`,
        page: attributes.page,
        pageSize: attributes.pageSize,
    }),
};

export const queryOptionGroups = async (ids, page, pageSize) => {
    const response = await query(querySpecification, { ids, page, pageSize });
    return {
        optionGroups: (response && response.optionGroups) || [],
        hasNextPage: !!(response && response.pager && response.pager.nextPage),
    };
};
