import { Async } from "domain/entities/Async";
import { UserMonitoringCountResponse } from "domain/entities/user-monitoring/common/UserMonitoring";
import { UserWithoutTwoFactor } from "domain/entities/user-monitoring/common/UserWithoutTwoFactor";
import { UserRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/UserRepository";
import _ from "lodash";
import { TwoFactorReportRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorReportRepository";
import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";

export class RunReportUsersWithout2FAUseCase {
    constructor(
        private userRepository: UserRepository,
        private reportRepository: TwoFactorReportRepository,
        private configRepository: TwoFactorConfigRepository
    ) {}

    async execute(): Async<UserMonitoringCountResponse> {
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
        const response: UserWithoutTwoFactor = {
            invalidUsersCount: userItems.length,
            listOfAffectedUsers: userItems,
            response: "Users without 2FA",
        };

        this.reportRepository.save(options.pushProgramId.id, response);
        return response;
    }
}
