import { NamedRef } from "domain/entities/Base";

export type User = NamedRef & { userRoles: NamedRef[] };
