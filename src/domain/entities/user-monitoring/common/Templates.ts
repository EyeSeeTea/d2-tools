import { Item } from "./Identifier";
import { UserRoleAuthority } from "./UserRoleAuthority";

export interface TemplateGroup {
    group: Item;
    template: Item;
}

export interface TemplateGroupWithAuthorities extends TemplateGroup {
    validRolesByAuthority: UserRoleAuthority[];
    invalidRolesByAuthority: UserRoleAuthority[];
    validRolesById: string[];
    invalidRolesById: string[];
}
