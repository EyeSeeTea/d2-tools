import _ from "lodash";
import randomSeed from "random-seed";
import { LoadingPlanRepository } from "../repositories/LoadingPlanRepository";
import { Execution, LoadingPlan } from "../entities/LoadingPlan";

export class RunLoadingPlanUseCase {
    constructor(private loadingPlanRespository: LoadingPlanRepository) {}

    async execute(options: Options) {
        for (const planId of options.planIdsToRun) {
            const plan = options.plans.find(plan => plan.id === planId);

            if (plan) {
                await this.runPlan(plan, options);
            } else {
                console.error(`Unknown plan: ${planId}`);
            }
        }
    }

    async runExecutionPlan(plan: LoadingPlan, execution: Execution, options: Options): Promise<void> {
        const { windowTimeSecs, users } = execution;

        console.debug(`Plan: ${plan.id} - window=${windowTimeSecs} secs - users=${users}`);
        const initialTime = new Date().getTime();

        const startTimes = _(0)
            .range(Math.ceil(users))
            .map(() => random.floatBetween(0, windowTimeSecs))
            .sortBy()
            .value();

        await this.loadingPlanRespository.init(options);

        const results = await runPromisesAtTimes(startTimes, async index => {
            console.debug(`Run plan [${plan.id}]: ${index + 1}/${startTimes.length}`);
            const startTime = new Date().getTime();
            const res = await this.loadingPlanRespository.run(plan, options);
            const endTime = new Date().getTime();
            console.debug(`Plan finished [${plan.id}]: ${index + 1}/${startTimes.length}`);
            return { ...res, totalTime: (endTime - startTime) / 1000.0 };
        });

        const totalRequest = _.sum(results.map(result => result.requestsCount));
        const errorCount = _.sum(results.map(result => result.requestsCountErrors));
        const errorsPercent = (100 * (errorCount / totalRequest)).toFixed(2);

        const requestsTime = _.sum(results.map(result => result.totalTime));
        const meanPlanTime = requestsTime / results.length;
        const planTotalTime = (new Date().getTime() - initialTime) / 1000;

        console.debug(
            [
                `Plan-results: ${plan.id} - window=${windowTimeSecs} secs - users=${users}`,
                `totalTime=${planTotalTime.toFixed(1)} secs`,
                `meanTime=${meanPlanTime.toFixed(1)} secs`,
                `errors=${errorCount}/${totalRequest} (${errorsPercent} %)`,
            ].join(" | ")
        );
    }

    async runPlan(plan: LoadingPlan, options: Options) {
        for (const execution of plan.executions) {
            await this.runExecutionPlan(plan, execution, options);
        }
    }
}

const random = randomSeed.create("12345");

async function runPromisesAtTimes<U>(atSecs: number[], mapper: (idx: number) => Promise<U>): Promise<U[]> {
    // 0, 5, 12, 20 -> [0, 5], [5, 12], [12, 20] -> 0, 5, 7, 8
    const waitTimes = [0].concat(pairwise(atSecs).map(([n1, n2]) => n2 - n1));

    const output: U[] = [];
    let idx = 0;

    for (const waitTime of waitTimes) {
        await wait(waitTime);
        mapper(idx).then(res => {
            return output.push(res);
        });
        idx++;
    }

    while (output.length !== atSecs.length) {
        await wait(0.1);
    }

    return output;
}

export interface Options {
    url: string;
    plans: LoadingPlan[];
    planIdsToRun: string[];
    auth: { username: string; password: string };
}

function pairwise<T>(xs: T[]): Array<[T, T]> {
    return _(0)
        .range(xs.length - 1)
        .map(idx => [xs[idx], xs[idx + 1]] as [T, T])
        .value();
}

function wait(secs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000 * secs));
}
