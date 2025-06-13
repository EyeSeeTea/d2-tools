import { NamedRef } from "domain/entities/Base";

export interface TwoFactorUserOptions {
    pushProgram: NamedRef;
    twoFactorGroup: NamedRef;
    config: {
    disableInvalid: boolean,
    exceptionGroup?: NamedRef[]
    };
}
