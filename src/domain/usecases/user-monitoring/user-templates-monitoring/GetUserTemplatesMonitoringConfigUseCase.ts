import { UserTemplatesMonitoringOptions } from "domain/entities/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringOptions";
import { UserTemplatesMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringConfigRepository";

export class GetUserTemplatesMonitoringConfigUseCase {
    constructor(private configRepository: UserTemplatesMonitoringConfigRepository) {}

    async execute(): Promise<UserTemplatesMonitoringOptions> {
        return this.configRepository.get();
    }
}
