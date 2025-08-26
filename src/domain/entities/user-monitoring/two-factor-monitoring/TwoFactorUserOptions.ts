import { NamedRef } from "domain/entities/Base";
import { Maybe } from "utils/ts-utils";

export interface TwoFactorUserOptions {
    pushProgram: NamedRef;
    twoFactorGroup: NamedRef;
    whoAccountGroup: Maybe<NamedRef>;
    exceptionGroup: Maybe<NamedRef[]>;
}
