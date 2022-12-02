import _ from "lodash";
import { Async } from "domain/entities/Async";
import { D2Api, PostOptions } from "types/d2-api";
import log from "utils/log";
import { UsersOptions, UsersRepository } from "domain/repositories/UsersRepository";
import { User, UserCSV, UserGroup, UserRes } from "./d2-users/D2Users.types";
import { UserNameFieldForCustomForm } from "capture-core/components/D2Form/field/Components";
import { unwatchFile } from "fs";
import { HttpResponse } from "@eyeseetea/d2-api/repositories/HttpClientRepository";
import { runMetadata } from "./dhis2-utils";
import { itemId } from "capture-core/components/DataEntries/SingleEventRegistrationEntry/DataEntryWrapper/DataEntry/helpers/constants";

type Users = { users: User[] };
type UserGroups = { userGroups: UserGroup[] };

export class UsersD2Repository implements UsersRepository {
    constructor(private api: D2Api) { }
    async checkPermissions(options: UsersOptions): Async<void> {
        const { templates: templateGroups } = options;
        debugger;
        const userTemplateIds = templateGroups.map(template => {
            return template.templateId;
        });
        const userGroupIds = templateGroups.map(template => {
            return template.groupId;
        });

        const allUserTemplates = await this.getUsers(userTemplateIds);
        const allGroupTemplates = await this.getGroups(userGroupIds);
        const allUsers = await this.getAllUsers();
        debugger;

        // aqui deberia de devolver el usuario con sus detalles
        //y los roles extra, y el usuario para ser pusheado.
        const userInfoRes: UserRes[] = allUsers.map(user => {

            const templateGroupMatch = templateGroups.find(template => {
                return user.userGroups.some(userGroup => template.groupId == userGroup.id);
            });

            const userTemplate = allUserTemplates.filter(item => {
                item.id == templateGroupMatch?.templateId;
            });
            const groupTemplate = allGroupTemplates.filter(item => {
                item.id == templateGroupMatch?.groupId;
            });

            //return errors, wa
            debugger;

            const validRoles = user.userRoles.filter(userRole => {
                userTemplate[0]?.userRoles.filter(userTemplateItem => {
                    return userRole.id == userTemplateItem.id;
                });
            });
            const invalidRoles = user.userRoles.filter(userRole => {
                userTemplate[0]?.userRoles.filter(userTemplateItem => {
                    userRole.id != userTemplateItem.id;
                });
            });
            const fixedUser = user
            fixedUser.userRoles = validRoles
            const userInfoRes: UserRes = {
                fixedUser: fixedUser, validUserRoles: validRoles, actionRequired: (invalidRoles.length > 0),
                invalidUserRoles: invalidRoles, userTemplate: userTemplate[0] ?? undefined, groupTemplate: groupTemplate[0] ?? undefined
            }
            return userInfoRes
        });
        const userActionRequired = userInfoRes.filter(item => item.actionRequired)

        //todo fix user update
        const userCSV: UserCSV[] = userActionRequired.map(async item => {

            const options: Partial<PostOptions> = { async: false };
            const response = await runMetadata(this.api.metadata.post({ "users": item.fixedUser }, options));

            item.networkRes = response.status
            if (response.status !== "OK") {
                console.error(JSON.stringify(response.typeReports, null, 4));
            }
            item.updated = true
            return {
                id: item.fixedUser.id,
                username: item.fixedUser.username,
                email: item.fixedUser.email,
                displayName: item.fixedUser.displayName,
                userGroups: item.fixedUser.userGroups.join(","),
                lastUpdatedBy: item.fixedUser.lastUpdatedBy.username,
                createdBy: item.fixedUser.createdBy.username,
                userType: item.groupTemplate,
                templateUser: item.userTemplate,
                validUserRoles: item.validUserRoles,
                invalidUserRoles: item.invalidUserRoles,
                networkRes: item.networkRes ?? "-"
            }

        })

        //todo write csv

    }

    private async getUsers(userIds: string[]): Promise<User[]> {
        log.info(`Get metadata: users IDS: ${userIds.join(", ")}`);

        const responses = await this.api
            .get<Users>(`/users?filter=id:in:[${userIds.join(",")}]&fields=*&paging=false.json`)
            .getData();

        return responses["users"];
    }

    private async getGroups(groupsIds: string[]): Promise<UserGroup[]> {
        log.info(`Get metadata: groups IDS: ${groupsIds.join(", ")}`);

        const responses = await this.api
            .get<UserGroups>(`/groups?filter=id:in:[${groupsIds.join(",")}]&fields=id,created,lastUpdated,name,users&paging=false.json`)
            .getData();

        return responses["userGroups"];
    }
    private async getAllUsers(): Promise<User[]> {
        log.info(`Get metadata: all users:`);

        const responses = await this.api.get<Users>(`/users.json?paging=false&fields=*`).getData();

        return responses["users"];
    }
}
