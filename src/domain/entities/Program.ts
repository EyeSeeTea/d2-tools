import { Id } from "./Base";

export type ProgramType = "WITH_REGISTRATION" | "WITHOUT_REGISTRATION";

export interface Program {
    id: Id;
    name: string;
    programType: ProgramType;
}
