import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupsMonitoringConfigRepository";

export class GetUserGroupsMonitoringConfigUseCase {
    constructor(private configRepository: UserGroupsMonitoringConfigRepository) {}

    async execute() {
        return this.configRepository.get();
    }
}
