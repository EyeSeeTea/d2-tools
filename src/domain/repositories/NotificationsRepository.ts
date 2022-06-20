import { Notification } from "domain/entities/Notification";

export interface NotificationsRepository {
    send(notification: Notification): Promise<void>;
}
