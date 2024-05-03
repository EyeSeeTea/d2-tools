import { Id } from "domain/entities/Base";

export interface UserDetails {
    id: Id;
    displayName: string;
    name: string;
    username: string;
}
