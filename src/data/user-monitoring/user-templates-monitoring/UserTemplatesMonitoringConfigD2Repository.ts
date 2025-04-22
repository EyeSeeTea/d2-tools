import _ from "lodash";

import log from "utils/log";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { getObject } from "../common/GetDataStoreObjectByKey";
import { d2ToolsNamespace, Namespace } from "data/externalConfig/Namespaces";
import { UserTemplatesMonitoringOptions } from "domain/entities/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringOptions";
import { UserTemplatesMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringConfigRepository";

export class UserTemplatesMonitoringConfigD2Repository implements UserTemplatesMonitoringConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Async<UserTemplatesMonitoringOptions> {
        const config = await getObject<UserTemplatesMonitoringOptions>(
            this.api,
            d2ToolsNamespace,
            Namespace.USER_TEMPLATE_MONITORING
        );

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }

    public async save(config: UserTemplatesMonitoringOptions): Promise<void> {
        await this.api.dataStore(d2ToolsNamespace).save(Namespace.USER_TEMPLATE_MONITORING, config).getData();
    }
}
