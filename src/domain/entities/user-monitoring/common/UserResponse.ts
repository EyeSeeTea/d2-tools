import { User } from "domain/entities/user-monitoring/common/User";
import { NamedRef } from "domain/entities/Base";

export interface UserResponse {
    user: User;
    fixedUser: User;
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
