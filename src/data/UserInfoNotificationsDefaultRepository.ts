import fs from "fs";
import CsvReadableStream from "csv-reader";
import jsonfile from "jsonfile";
import { Async } from "domain/entities/Async";
import { UserInfo, UserInfoNotification } from "domain/entities/UserInfoNotification";
import { ReportRow } from "./Report";
import log from "utils/log";
import { UserInfoNotificationsRepository } from "domain/repositories/UserInfoNotificationsRepository";

export class UserInfoNotificationDefaultRepository implements UserInfoNotificationsRepository {
    async get(userDetailsPath: string, emailContentPath: string): Async<UserInfoNotification> {
        return new Promise((resolve, reject) => {
            const userInfos: UserInfo[] = [];

            jsonfile
                .readFile(emailContentPath)
                .then(emailContent => {
                    fs.createReadStream(userDetailsPath, "utf8")
                        .pipe(new CsvReadableStream({ asObject: true, trim: true }))
                        .on("data", rawRow => {
                            const row = rawRow as unknown as Row;
                            if (!row.Username) return;

                            const userInfo: UserInfo = {
                                username: row.Username,
                                password: row.Password,
                            };
                            userInfos.push(userInfo);
                        })
                        .on("error", msg => {
                            log.error(msg.message);
                            return reject(msg);
                        })
                        .on("end", () => {
                            const userInfoNotifications: UserInfoNotification = {
                                userInfos,
                                email: emailContent,
                            };
                            return resolve(userInfoNotifications);
                        });
                })
                .catch(error => console.error(error));
        });
    }
}

const columns = ["Username", "Password"] as const;

type Column = typeof columns[number];
type Row = ReportRow<Column>;
