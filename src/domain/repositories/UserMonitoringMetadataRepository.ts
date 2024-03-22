import { ProgramMetadata } from "data/d2-users/D2Users.types";
import { Async } from "domain/entities/Async";
import {
    TemplateGroupWithAuthorities,
    UserMonitoringCountResponse,
    UserMonitoringDetails,
    UserWithoutTwoFactor,
    UsersOptions,
} from "domain/entities/UserMonitoring";

export interface UserMonitoringMetadataRepository {
    getTemplateAuthorities(options: UsersOptions): Promise<Async<TemplateGroupWithAuthorities[]>>;
    getMetadata(programId: string): Promise<Async<ProgramMetadata>>;
    saveReport(
        program: ProgramMetadata,
        responseGroups: UserMonitoringCountResponse,
        responseRoles: UserMonitoringDetails
    ): Promise<Async<string>>;
    saveUsersWithoutTwoFactor(
        program: ProgramMetadata,
        response: UserWithoutTwoFactor
    ): Promise<Async<string>>;
}
