import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupsMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroupsMonitoringOptions";
import { UserGroup } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroups";

import { getLogFormatDate } from "../GetLogFormatDate";

export class SaveUserGroupsMonitoringConfigUseCase {
    constructor(private configRepository: UserGroupsMonitoringConfigRepository) {}

    async execute(options: UserGroupsMonitoringOptions, monitoredUserGroups: UserGroup[]): Async<void> {
        const newOptions = {
            ...options,
            lastExecution: getLogFormatDate(new Date()),
            monitoredUserGroups: monitoredUserGroups,
        };

        await this.configRepository.save(newOptions);
    }
}
