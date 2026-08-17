import { UserRolesAuthoritiesMonitoringDataRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesMonitoringDataRepository";

export class GetUserRolesAuthoritiesMonitoringDataUseCase {
    constructor(private monitoringDataRepository: UserRolesAuthoritiesMonitoringDataRepository) {}

    async execute() {
        return this.monitoringDataRepository.get();
    }
}
