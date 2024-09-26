import { Id } from "domain/entities/Base";
import { UserGroup } from "./UserGroups";

export type UserGroupsMonitoringOptions = {
    groupsToMonitor: Id[];
    lastExecution: string;
    monitoredUserGroups: UserGroup[];
};
