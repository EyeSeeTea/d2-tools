import { User } from "domain/entities/user-monitoring/authorities-monitoring/User";

export interface AuthoritiesMonitor {
    lastExecution?: string;
    authoritiesToMonitor: string[];
    usersByAuthority: { [key: string]: User[] };
}
