import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
import { User } from "./d2-users/D2Users.types";

type Users = { users: User[] };

export class UsersD2Repository implements UsersRepository {
    constructor(private api: D2Api) {}
    async checkPermissions(options: UsersOptions): Async<void> {
        const { templates: templates } = options;
        debugger;
        const userTemplateIds = templates.map(template => {
            return template.templateId;
        });
        const userGroupIds = templates.map(template => {
            return template.groupId;
        });
        // const userGroupIds = templates.forEach(template => {template.groupId})
        const allUserTemplates = await this.getUsers(userTemplateIds);
        const allUsers = await this.getAllUsers();
        debugger;
        allUsers.map(user => {
            const templateUserGroup: string[] = userGroupIds.filter(templateUserGroup => {
                const value = user.userGroups.filter(userGroupItem => {
                    userGroupItem.id == templateUserGroup;
                });
                return value;
            });

            const templateMatch = templates.filter(template => {
                user.userGroups.filter(userGroup => {
                    template.groupId == userGroup.id;
                });
            });
            debugger;
            const userTemplate = allUserTemplates.filter(item => {
                item.id == templateMatch[0]?.templateId;
            });
            const validRoles = user.userRoles.filter(userRole => {
                userTemplate[0]?.userRoles.filter(userTemplateItem => {
                    userRole["id"] == userTemplateItem.id;
                });
            });
            const invalidRoles = user.userRoles.filter(userRole => {
                userTemplate[0]?.userRoles.filter(userTemplateItem => {
                    userRole["id"] != userTemplateItem["id"];
                });
            });
            debugger;
            console.log(validRoles ? validRoles[0]?.id : "-");
            console.log(invalidRoles ?? "-");
        });
    }

    private async getUsers(userIds: string[]): Promise<User[]> {
        log.info(`Get metadata: users IDS: ${userIds.join(", ")}`);

        const responses = await this.api
            .get<Users>(`/users?filter=id:in:[${userIds.join(",")}]&fields=*&paging=false.json`)
            .getData();

        return responses["users"];
    }

    private async getAllUsers(): Promise<User[]> {
        log.info(`Get metadata: all users:`);

        const responses = await this.api.get<Users>(`/users.json?paging=false&fields=*`).getData();

        return responses["users"];
    }
}
