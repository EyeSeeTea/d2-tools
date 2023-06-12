import { Id } from "./Base";
import { Email } from "./Notification";

export type User = {
    id: Id;
    username: string;
    email: Email;
    disabled?: boolean;
};

export type UserAttribute = {
    key: "email" | "username";
    value: "email" | "userCredentials.username";
};
