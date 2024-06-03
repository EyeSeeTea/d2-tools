import { Id } from "domain/entities/Base";

export interface TwoFactorUser {
    id: Id;
    twoFA: boolean;
    username: string;
}
