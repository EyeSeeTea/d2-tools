import { Id } from "./Base";
import { Email } from "./Notification";

export type User = {
    id: Id;
    username: string;
    email: Email;
    disabled?: boolean;
    firstName?: string;
    surname?: string;
    orgUnits?: OrgUnit[];
    code?: string;
};

type OrgUnit = {
    id: Id;
    name: string;
    code: string;
};

export type UserAttribute = Pick<User, "email" | "username">;
export const mappedAttributes: Array<keyof UserAttribute> = ["email", "username"];
