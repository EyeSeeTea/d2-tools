import { Id } from "@eyeseetea/d2-api";
import { UserGroupExtended } from "domain/entities/user-monitoring/common/UserGroupExtended";

export interface UserGroupRepository {
    getByIds(ids: Id[]): Promise<UserGroupExtended[]>;
    save(userGroup: UserGroupExtended): Promise<string>;
}
