import { NamedRef } from "domain/entities/Base";

export type TwoFactorUserReport = {
    invalidTwoFACount: number;
    invalidTwoFAList: NamedRef[];
    invalidWhoCount: number;
    invalidWhoList: NamedRef[];
    invalidAuthCount: number;
    invalidAuthList: NamedRef[];
};
