import { User } from "data/d2-users/D2Users.types";
import {
    TemplateGroupWithAuthorities,
    UserMonitoringCountResponse,
    UserMonitoringDetails,
    UsersOptions,
} from "domain/entities/UserMonitoring";

export interface UserAuthoritiesRepository {
    processUserGroups(
        options: UsersOptions,
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        users: User[]
    ): Promise<UserMonitoringCountResponse>;
    processUserRoles(
        options: UsersOptions,
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsers: User[]
    ): Promise<UserMonitoringDetails>;
}
