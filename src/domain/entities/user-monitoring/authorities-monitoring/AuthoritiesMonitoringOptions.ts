import { User } from "domain/entities/user-monitoring/authorities-monitoring/User";

export interface AuthoritiesMonitoringOptions {
    authoritiesToMonitor: string[];
    lastExecution: string;
    usersByAuthority: UsersByAuthority;
}

export interface UsersByAuthority {
    [authority: string]: User[];
}
