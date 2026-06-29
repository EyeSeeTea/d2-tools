import { Async } from "domain/entities/Async";
import { Authority } from "domain/entities/user-monitoring/user-roles-authorities-monitoring/Authority";

export interface AuthoritiesRepository {
    getAll(): Async<Authority[]>;
}
