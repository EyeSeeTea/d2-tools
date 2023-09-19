import { LoadingPlan } from "domain/entities/LoadingPlan";

export interface LoadingPlanRepository {
    init(options: Options): Promise<void>;
    run(plan: LoadingPlan, options: Options): Promise<RunResult>;
}

export interface Options {
    url: string;
    auth: { username: string; password: string };
}

export interface RunResult {
    time: number;
    requestsCountErrors: number;
    requestsCount: number;
    requestsTime: number;
}
