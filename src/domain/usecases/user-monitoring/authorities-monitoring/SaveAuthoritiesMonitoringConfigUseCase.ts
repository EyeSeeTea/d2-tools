import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import {
    AuthoritiesMonitoringOptions,
    UsersByAuthority,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

import { GetLogFormatDate } from "../GetLogFormatDate";

export class SaveAuthoritiesMonitoringConfigUseCase {
    constructor(private configRepository: AuthoritiesMonitoringConfigRepository) {}

    async execute(options: AuthoritiesMonitoringOptions, usersByAuthority: UsersByAuthority): Async<void> {
        const new_options = {
            ...options,
            lastExecution: new GetLogFormatDate().execute(new Date()),
            usersByAuthority: usersByAuthority,
        };

        await this.configRepository.save(new_options);
    }
}
