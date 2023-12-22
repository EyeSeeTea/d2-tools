import _ from "lodash";
import { ConfigRepository } from "domain/config/repositories/ConfigRepository";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import {
    ConfigClient,
    ExcludeRoleByGroup,
    ExcludeRoleByRole,
    ExcludeRoleByUser,
    ExcludeRoles,
    ExcludeUsers,
    TemplateGroups,
} from "domain/config/ConfigClient";
import { Namespace } from "./externalConfig/Namespaces";
import { Item, UsersOptions } from "domain/repositories/UsersRepository";
import log from "utils/log";

export class D2ExternalConfigRepository implements ConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    /*     public async getRolesByRoles(): Promise<ExcludeRoleByRole[]> {
        const config = await this.getConfig();
        const excludeRoleByRole = ([] = config.excludeRoleByRole ?? []);
        return excludeRoleByRole;
    }

    public async getRolesByGroup(): Promise<ExcludeRoleByGroup[]> {
        const config = await this.getConfig();
        const excludeRoleByGroup = ([] = config.excludeRoleByGroup ?? []);
        return excludeRoleByGroup;
    }

    public async getRolesByUser(): Promise<ExcludeRoleByUser[]> {
        const config = await this.getConfig();
        const excludeRoleByUser = ([] = config.excludeRoleByUser ?? []);
        return excludeRoleByUser;
    }

    public async getRoles(): Promise<ExcludeRoles[]> {
        const config = await this.getConfig();
        const excludeRoles = ([] = config.excludeRoles ?? []);
        return excludeRoles;
    }

    public async getUser(): Promise<ExcludeUsers[]> {
        const config = await this.getConfig();
        const excludeUsers = ([] = config.excludeUsers ?? []);
        return excludeUsers;
    }

    public async getTemplates(): Promise<TemplateGroups[]> {
        const config = await this.getConfig();
        const templateGroups = ([] = config.templateGroups ?? []);
        return templateGroups;
    } */
    private async getObject<T extends object>(key: string): Promise<T | undefined> {
        const value = await this.api.dataStore("d2-tools").get<T>(key).getData();
        return value;
    }

    public async getConfig(): Promise<UsersOptions> {
        const config = await this.getObject<ConfigClient>(Namespace.CONFIG);
        if (config) {
            debugger;
            // Asumiendo que mapTemplates modifica config y debes retornar algo de tipo UsersOptions.
            const usersOptions = this.mapTemplates(config);
            return usersOptions; // Asegúrate de que esto sea de tipo UsersOptions.
        } else {
            log.warn("Errpr loading config from datastore");
            throw new Error("Error loading config from datastore");
        }
    }

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
    /*     public mapTemplates(config: ConfigClient): UsersOptions {
        return {
            excludedRolesByRole: config.excludeRoleByRole,
            excludedRolesByGroup: config.excludeRoleByGroup,
            excludedRolesByUser: config.excludeRoleByUser,
            excludedRoles: config.excludeRoles.roles,
            excludedUsers: config.excludeUsers.users,
            templates: config.templateGroups,
            pushReport: config.pushReport,
            minimalGroupId: config.minimalGroup,
            minimalRoleId: config.minimalRole,
            pushProgramId: config.pushProgram,
        };
    } */
}
