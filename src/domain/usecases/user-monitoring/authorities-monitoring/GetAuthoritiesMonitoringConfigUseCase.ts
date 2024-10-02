import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

export class GetAuthoritiesMonitoringConfigUseCase {
    constructor(private configRepository: AuthoritiesMonitoringConfigRepository) {}

    async execute() {
        return this.configRepository.get();
    }
}
