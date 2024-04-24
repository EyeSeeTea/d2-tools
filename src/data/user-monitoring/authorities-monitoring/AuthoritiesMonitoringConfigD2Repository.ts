import _ from "lodash";

import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { Namespace } from "data/externalConfig/Namespaces";
import {
    AuthoritiesMonitoringOptions,
    monitoringConfig,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";
import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

export class AuthoritiesMonitoringConfigD2Repository implements AuthoritiesMonitoringConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    private async getObject<T extends object>(key: string): Promise<T | undefined> {
        const value = await this.api.dataStore("d2-tools").get<T>(key).getData();
        return value;
    }

    // TODO: coment with Ina, getObject does not gets a ConfigClient, hence the need to map it
    public async get(): Promise<AuthoritiesMonitoringOptions> {
        const config = await this.getObject<monitoringConfig>(Namespace.USER_MONITORING);
        if (config) {
            return this.mapTemplates(config);
        } else {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }
    }

    //for any reason the values aren't saved as ConfigClient, i must map it using the datastore namespaces
    public mapTemplates(config: any): AuthoritiesMonitoringOptions {
        return {
            ...config,
            AUTHORITIES_MONITOR: config[Namespace.AUTHORITIES_MONITOR],
        };
    }

    public async save(config: AuthoritiesMonitoringOptions): Promise<void> {
        await this.api.dataStore("d2-tools").save(Namespace.USER_MONITORING, config).getData();
    }
}
