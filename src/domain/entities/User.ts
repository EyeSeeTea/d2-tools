import { Id } from "./Base";
import { Email } from "./Notification";

export type User = {
    id: Id;
    username: string;
    email: Email;
};

export type UserMigrate = Pick<User, "id" | "email"> & {
    userCredentials: {
        username: string;
    };
    disabled?: boolean;
};
