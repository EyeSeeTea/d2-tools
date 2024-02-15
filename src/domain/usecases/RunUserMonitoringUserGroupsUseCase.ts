import { Async } from "domain/entities/Async";
import {
    Item,
    TemplateGroupWithAuthorities,
    User,
    UserMonitoringCountResponse,
} from "domain/entities/UserMonitoring";
import { UserGroupRepository } from "domain/repositories/UserGroupRepository";
import {
    UserMonitoringMetadataRepository,
    UsersOptions,
} from "domain/repositories/UserMonitoringMetadataRepository";
import { UserMonitoringRepository } from "domain/repositories/UserMonitoringRepository";
import _ from "lodash";
import log from "utils/log";

export class RunUserMonitoringUserGroupsUseCase {
    constructor(
        private userMonitoringMetadataRepository: UserMonitoringMetadataRepository,
        private userGroupRepository: UserGroupRepository,
        private userMonitoringRepository: UserMonitoringRepository
    ) {}

    async execute(options: UsersOptions): Async<UserMonitoringCountResponse> {
        const templatesWithAuthorities = await this.userMonitoringMetadataRepository.getTemplateAuthorities(
            options
        );

        const usersToProcessGroups = await this.userMonitoringRepository.getAllUsers(
            options.excludedUsers.map(item => {
                return item.id;
            }),
            true
        );

        const responseUserGroups = await this.processUserGroups(
            options,
            templatesWithAuthorities,
            usersToProcessGroups
        );
        return responseUserGroups;
    }

    async processUserGroups(
        options: UsersOptions,
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsersGroupCheck: User[]
    ): Promise<UserMonitoringCountResponse> {
        const { minimalGroupId } = options;

        const response = await this.addLowLevelTemplateGroupToUsersWithoutAny(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroupId
        );

        return response;
    }

    private async addLowLevelTemplateGroupToUsersWithoutAny(
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsersGroupCheck: User[],
        minimalGroupId: Item
    ): Promise<UserMonitoringCountResponse> {
        const userIdWithoutGroups: Item[] = this.detectUserIdsWithoutGroups(
            completeTemplateGroups,
            allUsersGroupCheck,
            minimalGroupId
        );

        log.info("Pushing fixed users without groups");
        return await this.pushUsersWithoutGroupsWithLowLevelGroup(userIdWithoutGroups, minimalGroupId);
    }

    private detectUserIdsWithoutGroups(
        completeTemplateGroups: TemplateGroupWithAuthorities[],
        allUsersGroupCheck: User[],
        minimalGroupId: Item
    ): Item[] {
        return _.compact(
            allUsersGroupCheck.map((user): Item | undefined => {
                const templateGroupMatch = completeTemplateGroups.find(template => {
                    return user.userGroups.some(
                        userGroup => userGroup != undefined && template.group.id == userGroup.id
                    );
                });

                if (templateGroupMatch == undefined) {
                    //template not found -> all roles are invalid except the minimal role
                    log.error(
                        `Warning: User don't have groups ${user.id} - ${user.name} adding to minimal group  ${minimalGroupId}`
                    );
                    const id: Item = { id: user.id, name: user.username };
                    return id;
                }
            })
        );
    }

    private async pushUsersWithoutGroupsWithLowLevelGroup(
        userIdWithoutGroups: Item[],
        minimalGroupId: Item
    ): Promise<UserMonitoringCountResponse> {
        if (userIdWithoutGroups != undefined && userIdWithoutGroups.length > 0) {
            const minimalUserGroup = await this.userGroupRepository.getByIds([minimalGroupId.id]);
            const userIds = userIdWithoutGroups.map(item => {
                return { id: item.id };
            });
            minimalUserGroup[0]?.users.push(...userIds);

            const response = await this.userGroupRepository.save(minimalUserGroup[0]!);
            return {
                response: response,
                invalidUsersCount: userIdWithoutGroups.length,
                listOfAffectedUsers: userIdWithoutGroups,
            };
        } else {
            return { response: "", invalidUsersCount: 0, listOfAffectedUsers: [] };
        }
    }
}
