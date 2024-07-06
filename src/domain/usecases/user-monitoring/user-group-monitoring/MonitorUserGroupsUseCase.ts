import _ from "lodash";
import log from "utils/log";

import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import { UserGroup, UserGroupDiff } from "domain/entities/user-monitoring/user-group-monitoring/UserGroups";
import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-group-monitoring/UserGroupsMonitoringOptions";

import { MessageRepository } from "domain/repositories/user-monitoring/common/MessageRepository";
import { UserGroupRepository } from "domain/repositories/user-monitoring/user-group-monitoring/UserGroupRepository";
import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-group-monitoring/UserGroupsMonitoringConfigRepository";

import { GetUserGroupsMonitoringConfigUseCase } from "./GetUserGroupsMonitoringConfigUseCase";
import { GetUserGroupsUseCase } from "./GetUserGroupsUseCase";
import { SaveUserGroupsMonitoringConfigUseCase } from "./SaveUserGroupsMonitoringConfigUseCase";
import { CompareUserGroupsUseCase } from "./CompareUserGroupsUseCase";

export class MonitorUserGroupsUseCase {
    constructor(
        private userGroupRepository: UserGroupRepository,
        private externalConfigRepository: UserGroupsMonitoringConfigRepository,
        private MessageRepository: MessageRepository
    ) {}

    private stringifyObject(ojb: any) {
        return JSON.stringify(ojb, null, 2);
    }

    private makeMessages(userGroupsChanges: UserGroupDiff[]): string {
        const messages = userGroupsChanges.map(changes => {
            const header = `Changes in group ${changes.id} | ${changes.name}:\n`;
            const message = [header];
            let newPropsMsg = "";
            let changedPropsLostMsg = "";
            let changedPropsAddedMsg = "";

            if (!_.isEmpty(changes.newProps)) {
                newPropsMsg = `New entries:\n${this.stringifyObject(changes.newProps)}\n`;
                message.push(newPropsMsg);
            }

            if (!_.isEmpty(changes.changedPropsLost) && !_.isEmpty(changes.changedPropsAdded)) {
                message.push("Modified fields:\n");

                changedPropsLostMsg = `Old values:\n${this.stringifyObject(changes.changedPropsLost)}\n`;
                message.push(changedPropsLostMsg);

                changedPropsAddedMsg = `New values:\n${this.stringifyObject(changes.changedPropsAdded)}\n`;
                message.push(changedPropsAddedMsg);
            }

            if (!_.isEmpty(changes.usersChanges.users_Lost) || !_.isEmpty(changes.usersChanges.users_Added)) {
                message.push("User assignment changes:\n");

                const usersLostMsg = `Users lost:\n${this.stringifyObject(
                    changes.usersChanges.users_Lost
                )}\n`;
                message.push(usersLostMsg);

                const usersAddedMsg = `Users added:\n${this.stringifyObject(
                    changes.usersChanges.users_Added
                )}\n`;
                message.push(usersAddedMsg);
            }
            return message.join("\n");
        });

        return messages.join("\n\n");
    }

    async execute(setDataStore: boolean): Async<void> {
        const options: UserGroupsMonitoringOptions = await new GetUserGroupsMonitoringConfigUseCase(
            this.externalConfigRepository
        ).execute();

        log.info(`Get user groups with ids: ${options.groupsToMonitor.join(", ")}`);

        const getGroupsUseCase = new GetUserGroupsUseCase(this.userGroupRepository);
        const compareUserGroupsUseCase = new CompareUserGroupsUseCase();

        const userGroups: UserGroup[] = await getGroupsUseCase.execute(options.groupsToMonitor);
        log.info("Retrieved user groups:");

        if (!setDataStore) {
            const userGroupsChanges = userGroups.flatMap(group => {
                const orig = options.monitoredUserGroups.find(g => g.id === group.id);
                if (!orig) {
                    log.info("No previous data for this group.");
                    return [];
                }

                const changes = compareUserGroupsUseCase.execute(orig, group);

                if (
                    _.isEmpty(changes.changedPropsAdded) &&
                    _.isEmpty(changes.changedPropsLost) &&
                    _.isEmpty(changes.newProps) &&
                    _.isEmpty(changes.usersChanges)
                ) {
                    return [];
                }

                return changes;
            });

            if (_.isEmpty(userGroupsChanges)) {
                log.info("Report: No changes.");
            } else {
                const messages = this.makeMessages(userGroupsChanges);
                // const teamsStatus = await this.MessageRepository.sendMessage(messages);
                // if (teamsStatus) {
                //     log.info(`Message sent to MSTeams`);
                // }

                log.info(`Report:\n${messages}`);
            }
        }

        // log.info("Updating datastore...");
        // await new SaveUserGroupsMonitoringConfigUseCase(this.externalConfigRepository).execute(
        //     options,
        //     userGroups
        // );
    }
}
