import { UsersOptions } from "domain/entities/UserMonitoring";

export interface UserMonitoringConfigRepository {
    get(): Promise<UsersOptions>;
}
