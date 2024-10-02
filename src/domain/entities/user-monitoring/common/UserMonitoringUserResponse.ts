import { NamedRef } from "domain/entities/Base";
import { PermissionFixerUser } from "../permission-fixer/PermissionFixerUser";

export interface UserMonitoringUserResponse {
    user: PermissionFixerUser;
    fixedUser: PermissionFixerUser;
    validUserRoles: NamedRef[];
    invalidUserRoles: NamedRef[];
    actionRequired: boolean;
    updated?: boolean;
    networkRes?: string;
    userNameTemplate?: string;
    templateIdTemplate?: string;
    groupIdTemplate?: string;
    multipleUserGroups?: string[];
    undefinedUserGroups?: boolean;
    undefinedRoles?: boolean;
}
