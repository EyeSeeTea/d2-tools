import _ from "lodash";

import log from "utils/log";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { getObject } from "../common/GetDataStoreObjectByKey";
import { d2ToolsNamespace, Namespace } from "data/externalConfig/Namespaces";
import { UserRolesAuthoritiesMonitoringData } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringData";
import { UserRolesAuthoritiesMonitoringDataRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringDataRepository";

export class UserRolesAuthoritiesMonitoringDataD2Repository
    implements UserRolesAuthoritiesMonitoringDataRepository
{
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Async<UserRolesAuthoritiesMonitoringData> {
        const data = await getObject<UserRolesAuthoritiesMonitoringData>(
            this.api,
            d2ToolsNamespace,
            Namespace.USER_ROLES_AUTHORITIES_MONITORING
        );

        if (!data) {
            log.warn("Error loading data from datastore");
            throw new Error("Error loading data from datastore");
        }

        return data;
    }

    public async save(data: UserRolesAuthoritiesMonitoringData): Promise<void> {
        await this.api
            .dataStore(d2ToolsNamespace)
            .save(Namespace.USER_ROLES_AUTHORITIES_MONITORING, data)
            .getData();
    }
}
