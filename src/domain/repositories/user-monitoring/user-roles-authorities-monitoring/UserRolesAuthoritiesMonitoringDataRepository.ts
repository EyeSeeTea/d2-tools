import { UserRolesAuthoritiesMonitoringData } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringData";

export interface UserRolesAuthoritiesMonitoringDataRepository {
    get(): Promise<UserRolesAuthoritiesMonitoringData>;
    save(data: UserRolesAuthoritiesMonitoringData): Promise<void>;
}
