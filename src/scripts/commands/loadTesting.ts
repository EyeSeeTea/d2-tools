import { Options, RunLoadingPlanUseCase } from "../../domain/usecases/RunLoadingPlanUseCase";
import { LoadingPlanHarRepository } from "../../data/LoadingPlanHarRepository";
import _ from "lodash";
import { command, option, subcommands, restPositionals, string } from "cmd-ts";
import fs from "fs";
import { LoadingPlan } from "domain/entities/LoadingPlan";

/*
Execute load tests from HAR. Steps:

1) Define a plan:

const homepagePlan: Plan = {
    id: "homepage",
    executions: [
        { windowTimeSecs: 60 , users: 1 },
        { windowTimeSecs: 60,  users: 10 },
        { windowTimeSecs: 60 , users: 50 },
    ],
};

This defines three sequential executions of src/hars/homepage.har, with 1/50/100 concurrent users that start the HAR at random points in the 0<->60secs interval.

2) Run: npx ts-node src/scripts/run-load-testing.ts http://host-used-in-har:8080 http://host-to-test:8081 hars homepagePlan

Plan-results: homepage - window=60 secs - users=1 | mean-time=6.4 s | errors=0/72 (0.00 %)
Plan-results: homepage - window=60 secs - users=10 | mean-time=8.8 s | errors=0/720 (0.00 %)
Plan-results: homepage - window=60 secs - users=50 | mean-time=7.0 s | errors=0/3600 (0.00 %)

IDEA for the next iteration: to make the request more real, we could run real scenarios
using a real browser (for example: headless chrome with puppeteer). Instead of HAR, we'd
run javascript code that runs the scenario.
*/

export function getCommand() {
    const runLoadingTestingCmd = command({
        name: "compare",
        description: "Compare pairs of DHIS2 data sets",
        args: {
            harsFolder: option({
                type: string,
                long: "hars-folder",
                description: "Folder containing HAR files",
            }),
            harUrl: option({
                type: string,
                long: "har-url",
                description: "Prefix for the URLs in HARs to user",
            }),
            baseUrl: option({
                type: string,
                long: "base-url",
                description: "Base URL for requuests",
            }),
            plansJsonFile: option({
                type: string,
                long: "plans-json",
                description: "Base URL for requuests",
            }),
            authStr: option({
                type: string,
                long: "auth",
                description: "USER:PASSWORD",
            }),
            planIds: restPositionals({
                type: string,
                displayName: "PLAIN_ID [...]",
                description: "Plan IDs to run",
            }),
        },
        handler: async args => {
            const { harsFolder, harUrl, baseUrl, authStr, plansJsonFile, planIds } = args;
            const [username = "admin", password = "district"] = authStr.split(":");
            // TODO: LoadingPlanRepository + LoadingPlanJsonFileRepository (with fs+Codec)
            const plans = JSON.parse(fs.readFileSync(plansJsonFile, "utf8")) as LoadingPlan[];
            const options: Options = {
                url: baseUrl,
                planIdsToRun: planIds,
                auth: { username, password },
                plans: plans,
            };
            const repo = new LoadingPlanHarRepository({ harsFolder, harUrl });

            await new RunLoadingPlanUseCase(repo).execute(options);
        },
    });

    return subcommands({
        name: "Load Testing",
        cmds: { run: runLoadingTestingCmd },
    });
}
