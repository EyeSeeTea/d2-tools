import { Id } from "./Base";

export type Option = {
    id: Id;
    name: string;
    code: string;
    sortOrder: number;
};

export const DEFAULT_VALID_LENGTH = 230;
