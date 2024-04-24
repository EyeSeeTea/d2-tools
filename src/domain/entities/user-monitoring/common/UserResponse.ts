import { User } from "domain/entities/user-monitoring/common/User";
import { IdItem } from "./Identifier";

export interface UserResponse {
    user: User;
    fixedUser: User;
    validUserRoles: IdItem[];
    invalidUserRoles: IdItem[];
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
