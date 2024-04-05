import { UsersOptions } from "domain/entities/user-monitoring/UserMonitoring";

export interface UserMonitoringConfigRepository {
    get(): Promise<UsersOptions>;
}
