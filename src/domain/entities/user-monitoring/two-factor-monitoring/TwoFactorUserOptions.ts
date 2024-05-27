import { NamedRef } from "domain/entities/Base";

export interface TwoFactorUserOptions {
    pushProgramId: NamedRef;
    twoFactorGroup: NamedRef;
}
