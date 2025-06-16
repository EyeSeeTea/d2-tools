import _ from "lodash";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { Async } from "domain/entities/Async";
import { NonUsersException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/NonUsersException";
import log from "utils/log";



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

        const twoFactorGroupUsers = await this.userRepository.getUsersByGroupId([options.twoFactorGroup.id]);

        if (!twoFactorGroupUsers) {
            throw new NonUsersException(
                "Users not found in the group. Check the group id. " + options.twoFactorGroup.id
            );
        }

        const excludedUserGroups = options.config.exceptionGroup?.map(group => group.id) ?? [];
        const excludedUsers = twoFactorGroupUsers.filter(user => {
            return user.userGroups.some(group => excludedUserGroups.includes(group.id));
        });

        const activeUsersWithoutTwoFactor = twoFactorGroupUsers.filter(user => {
            return user.twoFA == false && user.disabled == false && user.externalAuth == false;
        });

        const activeUsersWithoutTwoFactorFiltered = _.differenceBy(
            activeUsersWithoutTwoFactor,
            excludedUsers,
            "id"
        );

        (options.config.exceptionGroup ?? []).map(group => group.id);
        const userItems = activeUsersWithoutTwoFactorFiltered.map(user => {
            return { id: user.id, name: user.username };
        });

        const report: TwoFactorUserReport = {
            invalidUsersCount: userItems.length,
            listOfAffectedUsers: userItems ?? ["No users found"],
        };

        const programMetadata = await this.programRepository.get(options.pushProgram.id);

        const saveResponse = await this.reportRepository.save(programMetadata, report);
        if (shouldDisableInvalidUsers && activeUsersWithoutTwoFactorFiltered.length > 0) {
            const disableResponse = await this.userRepository.disableUsers(
                activeUsersWithoutTwoFactorFiltered.map(user => user.id)
            );
            return { message: saveResponse, disableUsersMessage: JSON.stringify(disableResponse), report };
        } else {
            if (shouldDisableInvalidUsers) {
                return {
                    message: saveResponse,
                    disableUsersMessage: "Disabled users action is not executed due not invalid users found.",
                    report,
                };
            } else {
                return {
                    message: saveResponse,
                    disableUsersMessage: "Disabled users action is not enabled.",
                    report,
                };
            }
        }
    }
}