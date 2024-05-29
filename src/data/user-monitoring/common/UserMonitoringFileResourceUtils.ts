import fs from "fs";
import * as CsvWriter from "csv-writer";
import { FileUploadParameters, Files } from "@eyeseetea/d2-api/api/files";
import { D2Api } from "types/d2-api";
import log from "utils/log";
import _ from "lodash";
import { getUid } from "utils/uid";
import { Async } from "domain/entities/Async";
import { UserMonitoringUserResponse } from "domain/entities/user-monitoring/common/UserMonitoringUserResponse";

export class UserMonitoringFileResourceUtils {
    //This method only works right when you build the application using nvm use 16
    static async saveFileResource(jsonString: string, name: string, api: D2Api): Async<string> {
        const jsonBlob = Buffer.from(jsonString, "utf-8");

        const files = new Files(api);
        const uniqueFilename = this.createUniqueFilename(name);
        const form: FileUploadParameters = {
            id: getUid(uniqueFilename),
            name: uniqueFilename,
            data: jsonBlob,
            ignoreDocument: true,
            domain: "DATA_VALUE",
        };
        log.info(`Saving file ${uniqueFilename}`);
        const response = await files.saveFileResource(form).getData();
        const fileresourceId = response;
        return fileresourceId;
    }

    private static createUniqueFilename(name: string): string {
        return `${this.formatDate(new Date())}${name}`;
    }

    private static formatDate(date: Date): string {
        return date
            .toLocaleString()
            .replace(/[ :\/\\,-]/g, "_")
            .replace("\\", "_");
    }

    static saveInJsonFormat(content: string, file: string) {
        fs.writeFileSync(file + ".json", content);
        log.info(`Json saved in ${file}`);
        return file;
    }

    static async savePermissionFixerToCsv(users: UserMonitoringUserResponse[], filepath: string) {
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvHeader = _.map(permissionFixerHeader, (obj, key) => ({ id: key, ...obj }));
        const csvWriter = createCsvWriter({ path: filepath + ".csv", header: csvHeader });

        const records = users.map((user): PermissionFixerRow => {
            return {
                id: user.user.id,
                username: user.user.userCredentials.username,
                lastUpdated: user.user.userCredentials.lastUpdated,
                lastLogin: user.user.userCredentials.lastLogin,
                disabled: user.user.userCredentials.disabled.toString(),
                actionRequired: user.actionRequired.toString(),
                undefinedGroups: user.undefinedUserGroups?.toString() ?? "",
                multipleGroups: user.multipleUserGroups?.join(", ") ?? "",
                userRoles: JSON.stringify(user.user.userRoles),
                validRoles: JSON.stringify(user.validUserRoles),
                invalidRoles: JSON.stringify(user.invalidUserRoles),
            };
        });

        await csvWriter.writeRecords(records);
    }
}

type Attr =
    | "id"
    | "username"
    | "lastUpdated"
    | "lastLogin"
    | "disabled"
    | "actionRequired"
    | "undefinedGroups"
    | "multipleGroups"
    | "userRoles"
    | "invalidRoles"
    | "validRoles";

type PermissionFixerRow = Record<Attr, string>;

const permissionFixerHeader: Record<Attr, { title: string }> = {
    id: { title: "User ID" },
    username: { title: "Username" },
    lastUpdated: { title: "LastUpdated" },
    lastLogin: { title: "LastLogin" },
    disabled: { title: "Disabled" },
    actionRequired: { title: "ActionRequired" },
    undefinedGroups: { title: "UndefinedGroups" },
    multipleGroups: { title: "MultipleTemplateGroups" },
    userRoles: { title: "UserRoles" },
    invalidRoles: { title: "InvalidRoles" },
    validRoles: { title: "ValidRoles" },
};
