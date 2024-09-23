import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroupsMonitoringOptions";
import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupsMonitoringConfigRepository";

export class GetUserGroupsMonitoringConfigUseCase {
    constructor(private configRepository: UserGroupsMonitoringConfigRepository) {}

    async execute(): Promise<UserGroupsMonitoringOptions> {
        return this.configRepository.get();
    }
}
