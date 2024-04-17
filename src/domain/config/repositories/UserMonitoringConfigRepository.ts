import { UserMonitoringConfig } from "domain/entities/user-monitoring/UserMonitoring";

export interface UserMonitoringConfigRepository {
    get(): Promise<UserMonitoringConfig>;
    save(config: UserMonitoringConfig): Promise<void>;
}
