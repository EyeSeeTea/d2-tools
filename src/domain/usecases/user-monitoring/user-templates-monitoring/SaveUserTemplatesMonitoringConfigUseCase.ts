import { UserTemplatesMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import { UserTemplatesMonitoringOptions } from "domain/entities/user-monitoring/user-templates-monitoring/UserTemplatesMonitoringOptions";
import { User } from "domain/entities/user-monitoring/user-templates-monitoring/Users";

import { getLogFormatDate } from "../GetLogFormatDate";

export class SaveUserTemplatesMonitoringConfigUseCase {
    constructor(private configRepository: UserTemplatesMonitoringConfigRepository) {}

    async execute(options: UserTemplatesMonitoringOptions, monitoredUserTemplates: User[]): Async<void> {
        const newOptions = {
            ...options,
            lastExecution: getLogFormatDate(new Date()),
            monitoredUserTemplates: monitoredUserTemplates,
        };

        await this.configRepository.save(newOptions);
    }
}
