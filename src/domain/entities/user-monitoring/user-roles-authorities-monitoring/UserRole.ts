import { Id, Name } from "domain/entities/Base";

export interface UserRole {
    id: Id;
    name: Name;
    authorities: string[];
}
