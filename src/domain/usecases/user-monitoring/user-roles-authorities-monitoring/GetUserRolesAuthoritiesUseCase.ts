import _ from "lodash";
import { Async } from "domain/entities/Async";
import { UserRolesAuthoritiesRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/UserRolesAuthoritiesRepository";
import { UserRole } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/UserRole";

export class GetUserRolesAuthoritiesUseCase {
    constructor(private userRolesAuthoritiesRepository: UserRolesAuthoritiesRepository) {}

    async execute(): Async<UserRole[]> {
        return await this.userRolesAuthoritiesRepository.getAll();
    }
}
