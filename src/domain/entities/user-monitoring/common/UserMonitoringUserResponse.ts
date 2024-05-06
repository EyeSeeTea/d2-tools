import { UserMonitoringUser } from "domain/entities/user-monitoring/common/UserMonitoringUser";
import { NamedRef } from "domain/entities/Base";

export interface UserMonitoringUserResponse {
    user: UserMonitoringUser;
    fixedUser: UserMonitoringUser;
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
