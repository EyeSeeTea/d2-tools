import _ from "lodash";

import log from "utils/log";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { getObject } from "../common/GetDataStoreObjectByKey";
import { d2ToolsNamespace, Namespace } from "data/externalConfig/Namespaces";
import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroupsMonitoringOptions";
import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupsMonitoringConfigRepository";

export class UserGroupsMonitoringConfigD2Repository implements UserGroupsMonitoringConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Async<UserGroupsMonitoringOptions> {
        const config = await getObject<UserGroupsMonitoringOptions>(
            this.api,
            d2ToolsNamespace,
            Namespace.USER_GROUPS_MONITORING
        );

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }

    public async save(config: UserGroupsMonitoringOptions): Promise<void> {
        await this.api.dataStore(d2ToolsNamespace).save(Namespace.USER_GROUPS_MONITORING, config).getData();
    }
}
