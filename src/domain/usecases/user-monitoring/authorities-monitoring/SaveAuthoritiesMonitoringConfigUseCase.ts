import { AuthoritiesMonitoringConfigRepository } from "domain/repositories/user-monitoring/authorities-monitoring/AuthoritiesMonitoringConfigRepository";

import { Async } from "domain/entities/Async";
import {
    AuthoritiesMonitoringOptions,
    UsersByAuthority,
} from "domain/entities/user-monitoring/authorities-monitoring/AuthoritiesMonitoringOptions";

export class SaveAuthoritiesMonitoringConfigUseCase {
    constructor(private configRepository: AuthoritiesMonitoringConfigRepository) {}

    private logFormatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds},${milliseconds}`;
    }

    async execute(options: AuthoritiesMonitoringOptions, usersByAuthority: UsersByAuthority): Async<void> {
        options.lastExecution = this.logFormatDate(new Date());
        options.usersByAuthority = usersByAuthority;

        await this.configRepository.save(options);
    }
}
