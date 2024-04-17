import { Async } from "domain/entities/Async";
import { UserMonitoringCountResponse } from "domain/entities/user-monitoring/common/UserMonitoring";
import { UserGroupRepository } from "domain/repositories/user-monitoring/permission-fixer/UserGroupRepository";
import { TemplateRepository } from "domain/repositories/user-monitoring/permission-fixer/TemplateRepository";
import { UserRepository } from "domain/repositories/user-monitoring/permission-fixer/UserRepository";
import _ from "lodash";
import log from "utils/log";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";
import { TemplateGroupWithAuthorities } from "domain/entities/user-monitoring/common/Templates";
import { User } from "domain/entities/user-monitoring/common/User";
import { Item } from "domain/entities/user-monitoring/common/Identifier";

export class RunUserPermissionUserGroupsUseCase {
    constructor(
        private usersTemplateRepository: TemplateRepository,
        private userGroupRepository: UserGroupRepository,
        private userRepository: UserRepository
    ) {}

    async execute(options: PermissionFixerUserOptions): Async<UserMonitoringCountResponse> {
        const templatesWithAuthorities = await this.usersTemplateRepository.getTemplateAuthorities(options);

        const usersToProcessGroups = await this.userRepository.getAllUsers(
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
        options: PermissionFixerUserOptions,
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
