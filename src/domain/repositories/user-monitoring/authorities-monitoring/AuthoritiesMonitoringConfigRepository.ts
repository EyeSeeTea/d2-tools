import { AuthoritiesMonitoringOptions } from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

export interface AuthoritiesMonitoringConfigRepository {
    get(): Promise<AuthoritiesMonitoringOptions>;
    save(config: AuthoritiesMonitoringOptions): Promise<void>;
}
