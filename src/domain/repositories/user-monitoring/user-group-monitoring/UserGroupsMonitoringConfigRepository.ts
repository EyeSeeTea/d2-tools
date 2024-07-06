import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-group-monitoring/UserGroupsMonitoringOptions";

export interface UserGroupsMonitoringConfigRepository {
    get(): Promise<UserGroupsMonitoringOptions>;
    save(config: UserGroupsMonitoringOptions): Promise<void>;
}
