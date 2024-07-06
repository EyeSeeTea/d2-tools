import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-group-monitoring/UserGroupsMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-group-monitoring/UserGroupsMonitoringOptions";
import { UserGroup } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";

import { GetLogFormatDateUseCase } from "../GetLogFormatDateUseCase";

export class SaveUserGroupsMonitoringConfigUseCase {
    constructor(private configRepository: UserGroupsMonitoringConfigRepository) {}

    async execute(options: UserGroupsMonitoringOptions, monitoredUserGroups: UserGroup[]): Async<void> {
        options.lastExecution = new GetLogFormatDateUseCase().execute(new Date());
        options.monitoredUserGroups = monitoredUserGroups;

        await this.configRepository.save(options);
    }
}
