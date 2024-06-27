import _ from "lodash";

import log from "utils/log";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { getObject } from "../common/GetDataStoreObjectByKey";
import { d2ToolsNamespace, Namespace } from "data/externalConfig/Namespaces";
import { AuthoritiesMonitoringOptions } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";
import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

export class AuthoritiesMonitoringConfigD2Repository implements AuthoritiesMonitoringConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Async<AuthoritiesMonitoringOptions> {
        const config = await getObject<AuthoritiesMonitoringOptions>(
            this.api,
            d2ToolsNamespace,
            Namespace.AUTHORITIES_MONITOR
        );

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }

    public async save(config: AuthoritiesMonitoringOptions): Promise<void> {
        await this.api.dataStore(d2ToolsNamespace).save(Namespace.AUTHORITIES_MONITOR, config).getData();
    }
}
