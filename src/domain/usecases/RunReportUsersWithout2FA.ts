import { Async } from "domain/entities/Async";
import {
    UserMonitoringCountResponse,
    UserWithoutTwoFactor,
    UsersOptions,
} from "domain/entities/UserMonitoring";
import { UserMonitoringMetadataRepository } from "domain/repositories/UserMonitoringMetadataRepository";
import { UserMonitoringRepository } from "domain/repositories/UserMonitoringRepository";
import _ from "lodash";

export class RunReportUsersWithout2FA {
    constructor(
        private userMonitoringMetadataRepository: UserMonitoringMetadataRepository,
        private userMonitoringRepository: UserMonitoringRepository
    ) {}

    async execute(options: UsersOptions): Async<UserMonitoringCountResponse> {
        const usersMustHave2FA = await this.userMonitoringRepository.getUsersByGroupId([
            options.twoFactorGroup.id,
        ]);
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
        const program = await this.userMonitoringMetadataRepository.getMetadata(options.pushProgramId.id);

        this.userMonitoringMetadataRepository.saveUsersWithoutTwoFactor(program, response);
        return response;
    }
}
