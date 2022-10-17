//
import log from "loglevel";
import i18n from "@dhis2/d2-i18n";
import { errorCreator } from "capture-core-utils";
import { convertToClientConfig } from "../helpers/eventFilters";
import { getEventListData } from "./getEventListData";
import { initListViewSuccess, initListViewError, buildFilterQueryArgs } from "../../WorkingListsCommon";

const errorMessages = {
    WORKING_LIST_RETRIEVE_ERROR: "Working list could not be loaded",
};

export const initEventWorkingListAsync = async (config, meta) => {
    const { commonQueryData, columnsMetaForDataFetching, categoryCombinationId, storeId, lastTransaction } =
        meta;
    const clientConfig = await convertToClientConfig(config, columnsMetaForDataFetching);
    const { currentPage, rowsPerPage, sortById, sortByDirection, filters } = clientConfig;
    const rawQueryArgs = {
        currentPage,
        rowsPerPage,
        sortById,
        sortByDirection,
        filters: buildFilterQueryArgs(filters, {
            columns: columnsMetaForDataFetching,
            storeId,
            isInit: true,
        }),
        fields: "dataValues,occurredAt,event,status,orgUnit,program,programType,updatedAt,createdAt,assignedUser,",
        ...commonQueryData,
    };

    return getEventListData(rawQueryArgs, columnsMetaForDataFetching, categoryCombinationId)
        .then(({ eventContainers, pagingData, request }) =>
            initListViewSuccess(storeId, {
                recordContainers: eventContainers,
                pagingData,
                request,
                config: {
                    ...clientConfig,
                    selections: {
                        ...commonQueryData,
                        lastTransaction,
                    },
                },
            })
        )
        .catch(error => {
            log.error(errorCreator(errorMessages.WORKING_LIST_RETRIEVE_ERROR)({ error }));
            return initListViewError(storeId, i18n.t("Working list could not be loaded"));
        });
};
