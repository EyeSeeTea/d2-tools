import { Id } from "@eyeseetea/d2-api";
import { UserRoleAuthority } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";

export interface UsersRepository {
    checkPermissions(options: UsersOptions): Promise<Async<void>>;
}

export interface TemplateGroup {
    templateId: Id;
    groupId: Id;
    validRolesByAuthority: UserRoleAuthority[];
    invalidRolesByAuthority: UserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
    name?: string;
}

export interface UsersOptions {
    templates: TemplateGroup[];
    excludedRoles: string[];
    excludedUsers: string[];
    pushReport: boolean;
}
