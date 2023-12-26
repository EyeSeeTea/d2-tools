import { ProgramMetadata, User } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import {
    TemplateGroupWithAuthorities,
    UserPermissionsCountResponse,
    UserPermissionsDetails,
    UsersOptions,
} from "domain/entities/UserPermissions";

export interface UserAuthoritiesRepository {
    processUserGroups(
        options: UsersOptions,
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        users: User[]
    ): Promise<UserPermissionsCountResponse>;
    processUserRoles(
        options: UsersOptions,
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsers: User[]
    ): Promise<UserPermissionsDetails>;
}
