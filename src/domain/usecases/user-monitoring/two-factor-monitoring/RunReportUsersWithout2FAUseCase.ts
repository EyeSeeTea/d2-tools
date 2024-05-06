import { Async } from "domain/entities/Async";
import { TwoFactorUserReport } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserReport";
import { UserMonitoringRepository } from "domain/repositories/user-monitoring/common/UserMonitoringRepository";
import _ from "lodash";
import { TwoFactorReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorReportRepository";
import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";
import log from "utils/log";

export class RunReportUsersWithout2FAUseCase {
    constructor(
        private userRepository: UserMonitoringRepository,
        private reportRepository: TwoFactorReportRepository,
        private configRepository: TwoFactorConfigRepository
    ) {}

    async execute(): Async<string> {
        const options = await this.configRepository.get();
        if (!options.twoFactorGroup) {
            throw new Error("Two factor group is not defined in the datastore.");
        }

        const usersMustHave2FA = await this.userRepository.getUsersByGroupId([options.twoFactorGroup.id]);
        if (usersMustHave2FA.length == 0) {
            throw new Error("Users not found in the group. Check the group id. " + options.twoFactorGroup.id);
        }

        const usersWithoutTwoFA = usersMustHave2FA.filter(user => {
            return user.twoFA == false;
        });
        const userItems = usersWithoutTwoFA.map(user => {
            return { id: user.id, name: user.username };
        });
        const response: TwoFactorUserReport = {
            invalidUsersCount: userItems.length,
            listOfAffectedUsers: userItems,
        };
        log.info("Users without 2FA: " + userItems.length);

        const saveResponse = this.reportRepository.save(options.pushProgramId.id, response);
        return saveResponse;
    }
}
