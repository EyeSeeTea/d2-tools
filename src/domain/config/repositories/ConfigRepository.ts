import { RolesByRoles, UsersOptions } from "domain/repositories/UsersRepository";
import {
    ConfigClient,
    ExcludeRoleByGroup,
    ExcludeRoleByRole,
    ExcludeRoleByUser,
    ExcludeRoles,
    ExcludeUsers,
    TemplateGroups,
} from "../ConfigClient";

export interface ConfigRepositoryConstructor {
    new (): ConfigRepository;
}

export interface ConfigRepository {
    /*     getRolesByRoles(): Promise<ExcludeRoleByRole[]>;
    getRolesByGroup(): Promise<ExcludeRoleByGroup[]>;
    getRolesByUser(): Promise<ExcludeRoleByUser[]>;
    getRoles(): Promise<ExcludeRoles[]>;
    getUser(): Promise<ExcludeUsers[]>;
    getTemplates(): Promise<TemplateGroups[]>; */
    getConfig(): Promise<UsersOptions>;
}
