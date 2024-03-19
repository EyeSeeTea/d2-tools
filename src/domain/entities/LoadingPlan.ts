export interface LoadingPlan {
    id: string;
    name: string; // i.e. HAR path
    executions: Execution[];
}

export interface Execution {
    windowTimeSecs: number;
    users: number;
}
