import { UserTemplatesMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringConfigRepository";

export class GetUserTemplatesMonitoringConfigUseCase {
    constructor(private configRepository: UserTemplatesMonitoringConfigRepository) {}

    async execute() {
        return this.configRepository.get();
    }
}
