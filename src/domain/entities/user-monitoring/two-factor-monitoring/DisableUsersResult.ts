export type DisableUserResultStatus = "success" | "error";

export interface DisableUserResult {
    userId: string;
    status: DisableUserResultStatus;
    response?: string;
    error?: unknown;
}
