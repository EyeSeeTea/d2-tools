import { Async } from "domain/entities/Async";
import { UserInfoNotification } from "domain/entities/UserInfoNotification";

export interface UserInfoNotificationsRepository {
    get(userDetailsPath: string, emailContentJsonPath: string): Async<UserInfoNotification>;
}
