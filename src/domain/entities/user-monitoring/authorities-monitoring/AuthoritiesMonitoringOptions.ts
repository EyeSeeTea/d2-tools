import { NamedRef } from "domain/entities/Base";

export interface AuthoritiesMonitoringOptions {
    authoritiesToMonitor: string[];
    lastExecution: string;
    usersByAuthority: UsersByAuthority;
}

export interface UsersByAuthority {
    [authority: string]: UserByAuthority[];
}

interface UserByAuthority extends NamedRef {
    userRoles: NamedRef[];
}
