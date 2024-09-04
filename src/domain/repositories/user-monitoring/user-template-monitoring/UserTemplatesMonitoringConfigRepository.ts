import { UserTemplatesMonitoringOptions } from "domain/entities/user-monitoring/user-template-monitoring/UserTemplatesMonitoringOptions";

export interface UserTemplatesMonitoringConfigRepository {
    get(): Promise<UserTemplatesMonitoringOptions>;
    save(config: UserTemplatesMonitoringOptions): Promise<void>;
}
