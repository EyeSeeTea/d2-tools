import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import {
    AuthoritiesMonitoringOptions,
    UsersByAuthority,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

import { GetLogFormatDateUseCase } from "../GetLogFormatDateUseCase";

export class SaveAuthoritiesMonitoringConfigUseCase {
    constructor(private configRepository: AuthoritiesMonitoringConfigRepository) {}

    async execute(options: AuthoritiesMonitoringOptions, usersByAuthority: UsersByAuthority): Async<void> {
        options.lastExecution = new GetLogFormatDateUseCase().execute(new Date());
        options.usersByAuthority = usersByAuthority;

        await this.configRepository.save(options);
    }
}
