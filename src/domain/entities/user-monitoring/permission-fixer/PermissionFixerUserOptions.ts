import { Item } from "../common/Identifier";
import { RolesByGroup } from "../common/RolesByGroup";
import { RolesByRoles } from "../common/RolesByRoles";
import { RolesByUser } from "../common/RolesByUser";
import { TemplateGroup } from "../common/Templates";
import { UserMonitoringCountResponse, UserMonitoringDetails } from "../common/UserMonitoring";

export interface PermissionFixerUserOptions {
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
}
