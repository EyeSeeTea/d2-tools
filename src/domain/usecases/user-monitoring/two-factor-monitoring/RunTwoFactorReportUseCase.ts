import _ from "lodash";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { Async } from "domain/entities/Async";
import { NonUsersException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/NonUsersException";
import { TwoFactorUser } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUser";
import { log } from "console";

type TwoFactorReportResponse = { message: string; report: TwoFactorUserReport, disableUsersMessage: string };

export class RunTwoFactorReportUseCase {
    constructor(
        private userRepository: TwoFactorUserD2Repository,
        private reportRepository: TwoFactorReportD2Repository,
        private configRepository: TwoFactorConfigD2Repository,
        private programRepository: UserMonitoringProgramD2Repository
    ) {}

    async execute(): Async<TwoFactorReportResponse> {
        const options = await this.configRepository.get();

        const twoFactorGroupUsers = await this.userRepository.getUsersByGroupId([options.twoFactorGroup.id]);

        if (!twoFactorGroupUsers) {
            throw new NonUsersException(
                "Users not found in the group. Check the group id. " + options.twoFactorGroup.id
            );
        }

        const excludedUserGroups = options.config.exceptionGroup?.map(group => group.id) ?? [];
        const excludedUsers = twoFactorGroupUsers.filter(user => {
            return (
                user.userGroups.some(group => excludedUserGroups.includes(group.id))
            );
        });

        const activeUsersWithoutTwoFactor = twoFactorGroupUsers.filter(user => {
            return user.twoFA == false && user.disabled == false && user.externalAuth == false;
        });

        const activeUsersWithoutTwoFactorFiltered = _.differenceBy(
            activeUsersWithoutTwoFactor,
            excludedUsers,
            "id"
        );

        (options.config.exceptionGroup ?? []).map(group => group.id)
        const userItems = activeUsersWithoutTwoFactorFiltered.map(user => {
            return { id: user.id, name: user.username };
        });

        const report: TwoFactorUserReport = {
            invalidUsersCount: userItems.length,
            listOfAffectedUsers: userItems ?? ["No users found"]
        };

        const programMetadata = await this.programRepository.get(options.pushProgram.id);
        
        const saveResponse = await this.reportRepository.save(programMetadata, report);

        const disabledUserResponse = await disableUsers(options.config.disableInvalid, activeUsersWithoutTwoFactorFiltered, this.userRepository);
        return { message: saveResponse, disableUsersMessage: disabledUserResponse, report };
    }
}

async function disableUsers(disableInvalid: boolean, activeUsersWithoutTwoFactorFiltered: TwoFactorUser[], userRepository: TwoFactorUserD2Repository): Async<string> {
    if (disableInvalid) {
            const disableResponse = await userRepository.disableUsers(
                activeUsersWithoutTwoFactorFiltered.map(user => user.id)
            );
            return JSON.stringify(disableResponse);;
    }
    return "Disabled users action is not enabled."
}

