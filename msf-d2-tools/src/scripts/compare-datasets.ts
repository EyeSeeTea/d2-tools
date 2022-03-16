import { command, run, string, option, restPositionals } from "cmd-ts";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { ShowDataSetsDiffUseCase } from "domain/usecases/ShowDataSetsDiffUseCase";
import path from "path";
import { D2Api } from "types/d2-api";

export function compareDataSetsCli() {
    const cmd = command({
        name: path.basename(__filename),
        description: "Compare DHIS2 data sets",
        args: {
            url: option({
                type: string,
                long: "dhis2-url",
                short: "u",
                description: "http://USERNAME:PASSWORD@localhost:8080",
            }),
            dataSetIdsPairs: restPositionals({
                type: string,
                displayName: "ID1-ID2",
            }),
        },
        handler: async args => {
            const api = new D2Api({ baseUrl: args.url });
            const dataSetsRepository = new DataSetsD2Repository(api);
            new ShowDataSetsDiffUseCase(dataSetsRepository).execute(args);
        },
    });

    run(cmd, process.argv.slice(2));
}
