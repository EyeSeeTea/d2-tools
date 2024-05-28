import _ from "lodash";
import { TwoFactorUserD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorUserD2Repository";
import { TwoFactorConfigD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorConfigD2Repository";
import { UserMonitoringProgramD2Repository } from "data/user-monitoring/common/UserMonitoringProgramD2Repository";
import { TwoFactorReportD2Repository } from "data/user-monitoring/two-factor-monitoring/TwoFactorReportD2Repository";
import log from "utils/log";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { Async } from "domain/entities/Async";
import { NonUsersException } from "domain/entities/user-monitoring/two-factor-monitoring/exception/NonUsersException";

export class RunTwoFactorReportUseCase {
    constructor(
        private userRepository: TwoFactorUserD2Repository,
        private reportRepository: TwoFactorReportD2Repository,
        private configRepository: TwoFactorConfigD2Repository,
        private programRepository: UserMonitoringProgramD2Repository
    ) {}

    async execute(): Async<string> {
        const options = await this.configRepository.get();

        const twoFactorGroupUsers = await this.userRepository.getUsersByGroupId([options.twoFactorGroup.id]);
        if (twoFactorGroupUsers.length == 0) {
            throw new NonUsersException(
                "Users not found in the group. Check the group id. " + options.twoFactorGroup.id
            );
        }

        const usersWithoutTwoFactor = twoFactorGroupUsers.filter(user => {
            return user.twoFA == false;
        });
        const userItems = usersWithoutTwoFactor.map(user => {
            return { id: user.id, name: user.username };
        });
        const response: TwoFactorUserReport = {
            invalidUsersCount: userItems.length,
            listOfAffectedUsers: userItems,
        };
        log.info("Users without two factor: " + userItems.length);
        const programMetadata = await this.programRepository.get(options.pushProgram.id);
        const saveResponse = await this.reportRepository.save(programMetadata, response);
        return saveResponse;
    }
}
