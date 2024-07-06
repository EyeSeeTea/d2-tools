import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";

export interface UserGroupRepository {
    get(ids: Id[]): Async<UserGroup[]>;
}
