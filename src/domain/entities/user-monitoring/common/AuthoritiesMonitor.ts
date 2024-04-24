import { NamedRef } from "domain/entities/Base";

export interface AuthoritiesMonitor {
    lastExecution?: string;
    authoritiesToMonitor: string[];
    usersByAuthority: { [key: string]: NamedRef[] };
}
