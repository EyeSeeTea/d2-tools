import { Async } from "domain/entities/Async";
import { UserGroup } from "domain/entities/UserGroup";

export interface UserGroupRepository {
    getAll(): Async<UserGroup[]>;
}

export type UserGroupParams = {
    page: number;
};
