import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import {
    AuthoritiesMonitoringOptions,
    UsersByAuthority,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

import { getLogFormatDate } from "../GetLogFormatDate";

export class SaveAuthoritiesMonitoringConfigUseCase {
    constructor(private configRepository: AuthoritiesMonitoringConfigRepository) {}

    async execute(options: AuthoritiesMonitoringOptions, usersByAuthority: UsersByAuthority): Async<void> {
        const newOptions = {
            ...options,
            lastExecution: getLogFormatDate(new Date()),
            usersByAuthority: usersByAuthority,
        };

        await this.configRepository.save(newOptions);
    }
}
