import { UserMonitoringConfigRepository } from "../repositories/UserMonitoringConfigRepository";

export class GetUserMonitoringConfigUseCase {
    constructor(private configRepository: UserMonitoringConfigRepository) {}

    async execute() {
        return this.configRepository.get();
    }
}
