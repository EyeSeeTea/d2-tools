import { UserTemplatesMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-template-monitoring/UserTemplatesMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import { UserTemplatesMonitoringOptions } from "domain/entities/user-monitoring/user-template-monitoring/UserTemplatesMonitoringOptions";
import { User } from "domain/entities/user-monitoring/user-template-monitoring/Users";

import { GetLogFormatDateUseCase } from "../GetLogFormatDateUseCase";

export class SaveUserTemplatesMonitoringConfigUseCase {
    constructor(private configRepository: UserTemplatesMonitoringConfigRepository) {}

    async execute(options: UserTemplatesMonitoringOptions, monitoredUserTemplates: User[]): Async<void> {
        options.lastExecution = new GetLogFormatDateUseCase().execute(new Date());
        options.monitoredUserTemplates = monitoredUserTemplates;

        await this.configRepository.save(options);
    }
}
