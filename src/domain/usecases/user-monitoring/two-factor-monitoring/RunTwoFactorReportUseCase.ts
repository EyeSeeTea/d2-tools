import _ from "lodash";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { Async } from "domain/entities/Async";

type TwoFactorReportResponse = { message: string; report: TwoFactorUserReport; disableUsersMessage: string };

export class RunTwoFactorReportUseCase {
    constructor(
        private userRepository: TwoFactorUserD2Repository,
        private reportRepository: TwoFactorReportD2Repository,
        private configRepository: TwoFactorConfigD2Repository,
        private programRepository: UserMonitoringProgramD2Repository
    ) {}

    async execute(shouldDisableInvalidUsers: boolean): Async<TwoFactorReportResponse> {
        const options = await this.configRepository.get();
        const programMetadata = await this.programRepository.get(options.pushProgram.id);
        
        const excludedUserGroups = options.exceptionGroup?.map(group => group.id) ?? [];
        const allUsers = await this.userRepository.getUsersNotInGroupIds(excludedUserGroups);

        if (!allUsers) {
            const report: TwoFactorUserReport = {
                invalidTwoFACount: 0,
                invalidTwoFAList: [],
                invalidWhoCount: 0,
                invalidWhoList: [],
                invalidAuthCount: 0,
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
            invalidTwoFACount: invalidTwoFactorUsers.length,
            invalidTwoFAList: invalidTwoFactorUsers.map(user => {
                return { id: user.id, name: user.username };
            }) ?? ["No users found"],
            invalidWhoCount: whoInvalidUsers.length,
            invalidWhoList: whoInvalidUsers.map(user => {
                return { id: user.id, name: user.username };
            }) ?? ["No users found"],
            invalidAuthCount: allInvalidUsers.length,
            invalidAuthList: allInvalidUsers.map(user => {
                return { id: user.id, name: user.username };
            }) ?? ["No users found"],
        };

        const saveResponse = await this.reportRepository.save(programMetadata, report);
        if (shouldDisableInvalidUsers) {
            if (invalidTwoFactorUsers.length > 0) {
                const disableResponse = await this.userRepository.disableUsers(
                    invalidTwoFactorUsers.map(user => user.id)
                );
                return {
                    message: saveResponse,
                    disableUsersMessage: JSON.stringify(disableResponse),
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
}
