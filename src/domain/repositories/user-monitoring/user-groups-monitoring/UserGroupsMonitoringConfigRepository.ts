import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroupsMonitoringOptions";

export interface UserGroupsMonitoringConfigRepository {
    get(): Promise<UserGroupsMonitoringOptions>;
    save(config: UserGroupsMonitoringOptions): Promise<void>;
}
