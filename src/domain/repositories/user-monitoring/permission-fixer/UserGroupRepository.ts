import { Id } from "domain/entities/Base";
import { UserGroupExtended } from "domain/entities/user-monitoring/common/UserGroupExtended";

export interface UserGroupRepository {
    getByIds(ids: Id[]): Promise<UserGroupExtended[]>;
    save(userGroup: UserGroupExtended): Promise<string>;
}
