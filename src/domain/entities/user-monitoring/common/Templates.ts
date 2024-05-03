import { NamedRef } from "domain/entities/Base";
import { UserRoleAuthority } from "./UserRoleAuthority";

export interface TemplateGroup {
    group: NamedRef;
    template: NamedRef;
}

export interface TemplateGroupWithAuthorities extends TemplateGroup {
    validRolesByAuthority: UserRoleAuthority[];
    invalidRolesByAuthority: UserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
}
