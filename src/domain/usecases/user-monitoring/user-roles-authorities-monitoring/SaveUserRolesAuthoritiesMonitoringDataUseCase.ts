import { Async } from "domain/entities/Async";

import { UserRolesAuthoritiesMonitoringDataRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringDataRepository";

import { UserRolesAuthoritiesMonitoringData } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringData";
import { UserRole } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRole";

import { getLogFormatDate } from "../GetLogFormatDate";

export class SaveUserRolesAuthoritiesMonitoringDataUseCase {
    constructor(private monitoringDataRepository: UserRolesAuthoritiesMonitoringDataRepository) {}

    async execute(userRoleAuthorities: UserRole[]): Async<void> {
        const newData: UserRolesAuthoritiesMonitoringData = {
            lastExecution: getLogFormatDate(new Date()),
            userRoleAuthorities: userRoleAuthorities,
        };

        await this.monitoringDataRepository.save(newData);
    }
}
