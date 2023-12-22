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
    getConfig(): Promise<UsersOptions>;
}
