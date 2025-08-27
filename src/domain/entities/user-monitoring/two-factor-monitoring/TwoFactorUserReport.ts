import { NamedRef } from "domain/entities/Base";

export type TwoFactorUserReport = {
    invalidTwoFAList: NamedRef[];
    invalidWhoList: NamedRef[];
    invalidAuthList: NamedRef[];
};
