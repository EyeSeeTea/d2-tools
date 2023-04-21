import { Async } from "domain/entities/Async";
import { UserInfoNotification } from "domain/entities/UserInfoNotification";

export interface UserInfoNotificationsRepository {
    get(userDetailsId: string, emailContentsId: string): Async<UserInfoNotification>;
}
