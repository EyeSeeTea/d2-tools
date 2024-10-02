import { Username } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { User } from "domain/entities/user-monitoring/user-templates-monitoring/Users";
import { UserRepository } from "domain/repositories/user-monitoring/user-templates-monitoring/UserRepository";

export class GetUserTemplatesUseCase {
    constructor(private userGroupRepository: UserRepository) {}

    async execute(usernames: Username[]): Async<User[]> {
        return this.userGroupRepository.getByUsername(usernames);
    }
}
