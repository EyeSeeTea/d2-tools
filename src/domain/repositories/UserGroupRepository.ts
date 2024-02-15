import { Id } from "@eyeseetea/d2-api";
import { UserGroup } from "data/d2-users/D2Users.types";

export interface UserGroupRepository {
    getByIds(ids: Id[]): Promise<UserGroup[]>;
    save(userGroup: UserGroup): Promise<string>;
}
