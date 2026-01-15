import { UserRole } from "./UserRole";

export interface UserRolesAuthoritiesMonitoringData {
    lastExecution: string;
    userRoleAuthorities: UserRole[];
}
