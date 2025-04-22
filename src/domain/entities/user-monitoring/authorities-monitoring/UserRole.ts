import { Id } from "domain/entities/Base";

export interface UserRole {
    id: Id;
    authorities: string[];
    name: string;
    users: {
        id: Id;
        username: string;
    }[];
}
