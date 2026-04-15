import { DisableUserResult } from "domain/entities/user-monitoring/two-factor-monitoring/DisableUsersResult";
import { TwoFactorUserRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorUserRepository";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { Async } from "domain/entities/Async";
import { TwoFactorReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorReportRepository";
import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";
import { UserMonitoringProgramRepository } from "domain/repositories/user-monitoring/common/UserMonitoringProgramRepository";

type TwoFactorReportResponse = { message: string; report: TwoFactorUserReport; disableUsersMessage: string };

export class RunTwoFactorReportUseCase {
    constructor(
        private userRepository: TwoFactorUserRepository,
        private reportRepository: TwoFactorReportRepository,
        private configRepository: TwoFactorConfigRepository,
        private programRepository: UserMonitoringProgramRepository
    ) {}

    async execute(twoFactorUseCaseOption: TwoFactorUseCaseOptions): Async<TwoFactorReportResponse> {
        const shouldDisableInvalidUsers = twoFactorUseCaseOption.shouldDisableInvalidUsers;
        const options = await this.configRepository.get();
        const programMetadata = await this.programRepository.get(options.pushProgram.id);

        const excludedUserGroups = options.exceptionGroup?.map(group => group.id) ?? [];
        const allUsers = await this.userRepository.getUsersNotInGroupIds(excludedUserGroups);

        if (!allUsers) {
            const report: TwoFactorUserReport = {
                invalidTwoFAList: [],
                invalidWhoList: [],
                invalidAuthList: [],
            };
            const saveResponse = await this.reportRepository.save(programMetadata, report);
            return {
                message: saveResponse,
                disableUsersMessage: "No users found.",
                report,
            };
        }

        //We need to check if the program metadata is valid due !in filter is not working propertly in dhis2 2.41
        const allUsersExceptExcluded = allUsers.filter(user => {
            return !user.userGroups.some(group => excludedUserGroups.includes(group.id));
        });

        const twoFactorUsers = allUsersExceptExcluded.filter(user => {
            return user.userGroups.some(group => options.twoFactorGroup.id === group.id);
        });

        const invalidTwoFactorUsers = twoFactorUsers.filter(user => {
            return user.externalAuth == false && user.twoFA == false && user.disabled == false;
        });

        const whoAccountUsers = allUsersExceptExcluded.filter(user => {
            return user.userGroups.some(group => options.whoAccountGroup?.id === group.id);
        });

        const whoInvalidUsers = whoAccountUsers.filter(user => {
            return user.disabled == false && user.externalAuth == false;
        });

        const usersNotInWhoOr2FA = allUsersExceptExcluded.filter(user => {
            const isInWho = whoAccountUsers.includes(user);
            const isIn2FA = twoFactorUsers.includes(user);
            return !isInWho && !isIn2FA;
        });

        // Filter all active users with wrong configurations
        const allInvalidUsers = allUsersExceptExcluded.filter(user => {
            const isEnabled = user.disabled == false;

            const isInWhoGroup = whoAccountUsers.some(u => u.id === user.id);
            const isInAuthGroup = twoFactorUsers.some(u => u.id === user.id);
            const isNotInWhoOr2FA = usersNotInWhoOr2FA.some(u => u.id === user.id);

            return isEnabled && ((isInWhoGroup && isInAuthGroup) || isNotInWhoOr2FA);
        });

        const report: TwoFactorUserReport = {
            invalidTwoFAList: invalidTwoFactorUsers.map(user => {
                return { id: user.id, name: user.username };
            }),
            invalidWhoList: whoInvalidUsers.map(user => {
                return { id: user.id, name: user.username };
            }),
            invalidAuthList: allInvalidUsers.map(user => {
                return { id: user.id, name: user.username };
            }),
        };

        const saveResponse = await this.reportRepository.save(programMetadata, report);
        if (shouldDisableInvalidUsers) {
            if (invalidTwoFactorUsers.length > 0) {
                const disableResults = await this.userRepository.disableUsers(
                    invalidTwoFactorUsers.map(user => user.id)
                );
                return {
                    message: saveResponse,
                    disableUsersMessage: this.buildDisableUsersMessage(disableResults),
                    report,
                };
            } else {
                return {
                    message: saveResponse,
                    disableUsersMessage:
                        "Disabled users action is not executed due to no invalid users found.",
                    report,
                };
            }
        }
        return {
            message: saveResponse,
            disableUsersMessage: "Disabled users action is not enabled.",
            report,
        };
    }

    private buildDisableUsersMessage(disableResults: DisableUserResult[]): string {
        const successes = disableResults.filter(r => r.status === "success");
        const failures = disableResults.filter(r => r.status === "error");

        const failureDetails = failures
            .map(f => `${f.userId}${f.error ? ` (${String(f.error)})` : ""}`)
            .join(" | ");

        return `Disabled users action is enabled and executed. Success: ${successes.length}. Errors: ${
            failures.length
        }.${failureDetails ? ` Failed: ${failureDetails}` : ""}`;
    }
}

interface TwoFactorUseCaseOptions {
    shouldDisableInvalidUsers: boolean;
}
