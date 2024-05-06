import { Ref } from "domain/entities/Base";

export interface UserGroupExtended {
    name: string;
    id: string;
    users: Ref[];
}
