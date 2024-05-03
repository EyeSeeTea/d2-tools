import { Ref, StringDateTime } from "domain/entities/Base";

export interface UserGroupExtended {
    created: StringDateTime;
    lastUpdated: StringDateTime;
    name: string;
    id: string;
    users: Ref[];
}
