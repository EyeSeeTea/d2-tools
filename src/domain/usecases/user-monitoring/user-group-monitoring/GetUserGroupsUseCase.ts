import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";
import { UserGroupRepository } from "domain/repositories/user-monitoring/user-group-monitoring/UserGroupRepository";

export class GetUserGroupsUseCase {
    constructor(private userGroupRepository: UserGroupRepository) {}

    async execute(ids: Id[]): Async<UserGroup[]> {
        return this.userGroupRepository.get(ids);
    }
}
