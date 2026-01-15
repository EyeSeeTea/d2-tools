import _ from "lodash";
import { Async } from "domain/entities/Async";
import { AuthoritiesRepository } from "domain/repositories/user-monitoring/user-roles-authorities-monitoring/AuthoritiesRepository";
import { Authority } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/Authority";

export class GetAuthoritiesUseCase {
    constructor(private authoritiesRepository: AuthoritiesRepository) {}

    async execute(): Async<Authority[]> {
        return await this.authoritiesRepository.getAll();
    }
}
