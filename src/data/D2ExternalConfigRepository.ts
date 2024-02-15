import _ from "lodash";
import { UserMonitoringConfigRepository } from "domain/config/repositories/UserMonitoringConfigRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { ConfigClient } from "domain/config/ConfigClient";
import { Namespace } from "./externalConfig/Namespaces";
import log from "utils/log";
import { UsersOptions } from "domain/entities/UserMonitoring";

export class D2ExternalConfigRepository implements UserMonitoringConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    private async getObject<T extends object>(key: string): Promise<T | undefined> {
        const value = await this.api.dataStore("d2-tools").get<T>(key).getData();
        return value;
    }

    public async get(): Promise<UsersOptions> {
        const config = await this.getObject<ConfigClient>(Namespace.USER_MONITORING);
        if (config) {
            const usersOptions = this.mapTemplates(config);
            return usersOptions;
        } else {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }
    }

    //for any reason the values aren't saved as ConfigClient, i must map it using the datastore namespaces
    public mapTemplates(config: any): UsersOptions {
        return {
            excludedRolesByRole: config[Namespace.EXCLUDE_ROLES_BY_ROLE],
            excludedRolesByGroup: config[Namespace.EXCLUDE_ROLES_BY_GROUPS],
            excludedRolesByUser: config[Namespace.EXCLUDE_ROLES_BY_USERS],
            excludedRoles: config[Namespace.EXCLUDE_ROLES],
            excludedUsers: config[Namespace.EXCLUDE_USERS],
            templates: config[Namespace.TEMPLATE_GROUPS],
            pushReport: config[Namespace.PUSH_REPORT],
            minimalGroupId: config[Namespace.MINIMAL_GROUP],
            minimalRoleId: config[Namespace.MINIMAL_ROLE],
            pushProgramId: config[Namespace.PUSH_PROGRAM_ID],
        };
    }
}
