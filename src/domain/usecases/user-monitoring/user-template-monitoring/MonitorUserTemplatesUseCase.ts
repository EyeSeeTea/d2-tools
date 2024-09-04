import _ from "lodash";
import log from "utils/log";

import { Async } from "domain/entities/Async";
import { NamedRef } from "domain/entities/Base";
import { User, UserTemplateDiff } from "domain/entities/user-monitoring/user-template-monitoring/Users";
import { UserTemplatesMonitoringOptions } from "domain/entities/user-monitoring/user-template-monitoring/UserTemplatesMonitoringOptions";

import { MessageRepository } from "domain/repositories/user-monitoring/common/MessageRepository";
import { UserRepository } from "domain/repositories/user-monitoring/user-template-monitoring/UserRepository";
import { UserTemplatesMonitoringConfigRepository } from "domain/repositories/user-monitoring/user-template-monitoring/UserTemplatesMonitoringConfigRepository";

import { GetUserTemplatesUseCase } from "./GetUserTemplatesUseCase";
import { CompareUserTemplatesUseCase } from "./CompareUserTemplatesUseCase";
import { GetUserTemplatesMonitoringConfigUseCase } from "./GetUserTemplatesMonitoringConfigUseCase";
import { SaveUserTemplatesMonitoringConfigUseCase } from "./SaveUserTemplatesMonitoringConfigUseCase";

export class MonitorUserTemplatesUseCase {
    constructor(
        private usersRepository: UserRepository,
        private externalConfigRepository: UserTemplatesMonitoringConfigRepository,
        private MessageRepository: MessageRepository
    ) {}

    private stringifyObject(ojb: any) {
        return JSON.stringify(ojb, null, 2);
    }

    private checkMembershipChanges(
        lostMembership: NamedRef[],
        addedMembership: NamedRef[],
        membershipType: "User Roles" | "User Groups"
    ): string[] {
        const message: string[] = [];

        if (!_.isEmpty(lostMembership) || !_.isEmpty(addedMembership)) {
            message.push(`${membershipType} changes:\n`);

            const usersLostMsg = `${membershipType} lost:\n${this.stringifyObject(lostMembership)}\n`;
            message.push(usersLostMsg);

            const usersAddedMsg = `${membershipType} added:\n${this.stringifyObject(addedMembership)}\n`;
            message.push(usersAddedMsg);
        }

        return message;
    }

    private makeMessages(userTemplatesChanges: UserTemplateDiff[]): string {
        const messages = userTemplatesChanges.map(changes => {
            const header = `Changes in template ${changes.id} | ${changes.username}:\n`;
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

            const rolesMembershipMessage = this.checkMembershipChanges(
                changes.membershipChanges.userRoles_Lost,
                changes.membershipChanges.userRoles_Added,
                "User Roles"
            );

            const groupsMembershipMessage = this.checkMembershipChanges(
                changes.membershipChanges.userRoles_Lost,
                changes.membershipChanges.userRoles_Added,
                "User Groups"
            );

            message.push(...rolesMembershipMessage, ...groupsMembershipMessage);

            return message.join("\n");
        });

        return messages.join("\n\n");
    }

    async execute(setDataStore: boolean): Async<void> {
        const options: UserTemplatesMonitoringOptions = await new GetUserTemplatesMonitoringConfigUseCase(
            this.externalConfigRepository
        ).execute();

        log.info(`Get user groups with usernames: ${options.templatesToMonitor.join(", ")}`);

        const getTemplatesUseCase = new GetUserTemplatesUseCase(this.usersRepository);
        const compareUserTemplatesUseCase = new CompareUserTemplatesUseCase();

        const userTemplates: User[] = await getTemplatesUseCase.execute(options.templatesToMonitor);
        log.info(`Retrieved user templates: ${userTemplates.map(g => g.username).join(", ")}`);

        if (!setDataStore) {
            const userGroupsChanges = userTemplates.flatMap(user => {
                const templateUsername = user.username;
                const orig = options.monitoredUserTemplates.find(g => g.username === templateUsername);
                if (!orig) {
                    log.info(`No previous data for template: ${templateUsername}.`);
                    return [];
                }

                const changes = compareUserTemplatesUseCase.execute(orig, user);

                if (
                    _.isEmpty(changes.changedPropsAdded) &&
                    _.isEmpty(changes.changedPropsLost) &&
                    _.isEmpty(changes.newProps) &&
                    _.isEmpty(changes.membershipChanges)
                ) {
                    return [];
                }

                return changes;
            });

            log.info(`userGroupsChanges: ${this.stringifyObject(userGroupsChanges)}`);

            if (_.isEmpty(userGroupsChanges)) {
                log.info("Report: No changes.");
            } else {
                const messages = this.makeMessages(userGroupsChanges);
                const teamsStatus = await this.MessageRepository.sendMessage(messages);
                if (teamsStatus) {
                    log.info(`Message sent to MSTeams`);
                }

                log.info(`Report:\n${messages}`);
            }
        }

        log.info("Updating datastore...");
        await new SaveUserTemplatesMonitoringConfigUseCase(this.externalConfigRepository).execute(
            options,
            userTemplates
        );
    }
}
