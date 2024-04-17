import { Item } from "./Identifier";
import { RolesByGroup } from "./RolesByGroup";
import { RolesByRoles } from "./RolesByRoles";
import { RolesByUser } from "./RolesByUser";
import { TemplateGroup } from "./Templates";
import { UserMonitoringCountResponse, UserMonitoringDetails } from "./UserMonitoring";

export interface UsersOptions {
    userRolesResponse?: UserMonitoringDetails;
    userGroupsResponse?: UserMonitoringCountResponse;
    templates: TemplateGroup[];
    excludedRoles: Item[];
    excludedUsers: Item[];
    excludedRolesByUser: RolesByUser[];
    excludedRolesByGroup: RolesByGroup[];
    excludedRolesByRole: RolesByRoles[];
    pushReport: boolean;
    pushProgramId: Item;
    minimalGroupId: Item;
    minimalRoleId: Item;
    twoFactorGroup: Item;
}
