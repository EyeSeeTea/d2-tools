import { Username } from "domain/entities/Base";
import { User } from "./Users";

export type UserTemplatesMonitoringOptions = {
    templatesToMonitor: Username[];
    lastExecution: string;
    monitoredUserTemplates: User[];
};
