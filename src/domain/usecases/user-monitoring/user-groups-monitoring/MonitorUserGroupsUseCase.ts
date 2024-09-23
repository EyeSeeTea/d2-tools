import _ from "lodash";
import log from "utils/log";

import { Async } from "domain/entities/Async";
import { UserGroup, UserGroupDiff } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroups";
import { UserGroupsMonitoringOptions } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroupsMonitoringOptions";

import { MessageRepository } from "domain/repositories/user-monitoring/common/MessageRepository";
import { UserGroupRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupRepository";
import { UserGroupsMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-groups-monitoring/UserGroupsMonitoringConfigRepository";

import { GetUserGroupsUseCase } from "./GetUserGroupsUseCase";
import { CompareUserGroups } from "./CompareUserGroups";
import { GetUserGroupsMonitoringConfigUseCase } from "./GetUserGroupsMonitoringConfigUseCase";
import { SaveUserGroupsMonitoringConfigUseCase } from "./SaveUserGroupsMonitoringConfigUseCase";

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

            if (!_.isEmpty(changes.usersChanges.usersLost) || !_.isEmpty(changes.usersChanges.usersAdded)) {
                message.push("User assignment changes:\n");

                const usersLostMsg = `Users lost:\n${this.stringifyObject(changes.usersChanges.usersLost)}\n`;
                message.push(usersLostMsg);

                const usersAddedMsg = `Users added:\n${this.stringifyObject(
                    changes.usersChanges.usersAdded
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
        const compareUserGroupsUseCase = new CompareUserGroups();

        const userGroups: UserGroup[] = await getGroupsUseCase.execute(options.groupsToMonitor);
        log.info(`Retrieved user groups: ${userGroups.map(g => g.id).join(", ")}`);

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
                    _.isEmpty(changes.usersChanges.usersAdded) &&
                    _.isEmpty(changes.usersChanges.usersLost)
                ) {
                    return [];
                }

                return changes;
            });

            if (_.isEmpty(userGroupsChanges)) {
                log.info("Report: No changes.");
            } else {
                const messages = this.makeMessages(userGroupsChanges);
                const teamsStatus = await this.MessageRepository.sendMessage(
                    "USERGROUPS-MONITORING",
                    messages
                );
                if (teamsStatus) {
                    log.info(`Message sent to MSTeams`);
                }

                log.info(`Report:\n${messages}`);
            }
        }

        log.info("Updating datastore...");
        await new SaveUserGroupsMonitoringConfigUseCase(this.externalConfigRepository).execute(
            options,
            userGroups
        );
    }
}
