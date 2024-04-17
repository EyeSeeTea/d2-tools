import { Async } from "domain/entities/Async";
import {
    UserMonitoringCountResponse,
    UserWithoutTwoFactor,
    UserMonitoringConfig,
} from "domain/entities/user-monitoring/UserMonitoring";
import { MetadataRepository } from "domain/repositories/user-monitoring/MetadataRepository";
import { ReportRepository } from "domain/repositories/user-monitoring/ReportRepository";
import { UserRepository } from "domain/repositories/user-monitoring/UserRepository";
import _ from "lodash";

export class RunReportUsersWithout2FA {
    constructor(
        private metadataRepository: MetadataRepository,
        private userRepository: UserRepository,
        private reportRepository: ReportRepository
    ) {}

    async execute(options: UserMonitoringConfig): Async<UserMonitoringCountResponse> {
        const usersMustHave2FA = await this.userRepository.getUsersByGroupId([options.twoFactorGroup.id]);
        if (usersMustHave2FA.length == 0) {
            throw new Error("Users not found in the group. Check the group id. " + options.twoFactorGroup.id);
        }
        console.log("Users must have 2FA: ", usersMustHave2FA);
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
        const program = await this.metadataRepository.getMetadata(options.pushProgramId.id);

        this.reportRepository.saveUsersWithoutTwoFactor(program, response);
        return response;
    }
}
