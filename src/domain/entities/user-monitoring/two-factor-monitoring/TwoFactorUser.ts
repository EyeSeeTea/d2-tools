import { Named } from "cmd-ts/dist/cjs/helpdoc";
import { Id, NamedRef } from "domain/entities/Base";

export interface TwoFactorUser {
    id: Id;
    twoFA: boolean;
    username: string;
    disabled: boolean;
    externalAuth: boolean;
    userGroups: NamedRef[];
}
