import _ from "lodash";
import { command, run, string, option, restPositionals, optional, subcommands, Type } from "cmd-ts";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { ShowDataSetsDiffUseCase } from "domain/usecases/ShowDataSetsDiffUseCase";
import path from "path";
import { D2Api } from "types/d2-api";
import { ShowSchemaUseCase } from "domain/usecases/ShowSchemaUseCase";

export function compareDataSetsCli() {
    const compareCmd = command({
        name: path.basename(__filename),
        description: "Compare pairs of DHIS2 data sets",
        args: {
            url: option({
                type: string,
                long: "dhis2-url",
                short: "u",
                description: "http://USERNAME:PASSWORD@localhost:8080",
            }),
            ignoreProperties: option({
                type: optional(StringsSeparatedByCommas),
                long: "ignore-properties",
                description: "PROP1,PROP2,...",
            }),
            dataSetIdsPairs: restPositionals({
                type: StringPairSeparatedByDash,
                displayName: "ID1-ID2",
            }),
        },
        handler: async args => {
            if (_.isEmpty(args.dataSetIdsPairs)) throw new Error("Missing ID pairs: ID1-ID2");
            const api = new D2Api({ baseUrl: args.url });
            const dataSetsRepository = new DataSetsD2Repository(api);
            const showDiff = new ShowDataSetsDiffUseCase(dataSetsRepository);
            const results = await showDiff.execute(args);
            const allEqual = _(results).every(result => result.type === "equal");
            const statusCode = allEqual ? 0 : 1;
            process.exit(statusCode);
        },
    });

    const showSchemaCmd = command({
        name: path.basename(__filename),
        description: "Show DHIS2 data sets schema to be used in compare command",
        args: {},
        handler: async () => {
            const api = new D2Api({ baseUrl: "" });
            const dataSetsRepository = new DataSetsD2Repository(api);
            new ShowSchemaUseCase(dataSetsRepository).execute();
            process.exit(0);
        },
    });

    const dataSetSubcommands = subcommands({
        name: "DHIS2 Data set",
        cmds: { compare: compareCmd, "show-schema": showSchemaCmd },
    });

    const cliSubcommands = subcommands({
        name: "DHIS2 Data set",
        cmds: { datasets: dataSetSubcommands },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}

type Pair = [string, string];

const StringPairSeparatedByDash: Type<string, Pair> = {
    async from(str) {
        const [id1, id2] = str.split("-");
        if (!id1 || !id2) throw new Error(`Invalid pair: ${str} (expected ID1-ID2)`);
        return [id1, id2];
    },
};

const StringsSeparatedByCommas: Type<string, string[]> = {
    async from(str) {
        return str.split(",");
    },
};
