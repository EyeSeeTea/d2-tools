import _ from "lodash";
import { command, string, option, restPositionals, optional, subcommands, Type } from "cmd-ts";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { ShowDataSetsDiffUseCase } from "domain/usecases/ShowDataSetsDiffUseCase";
import { D2Api } from "types/d2-api";
import { ShowSchemaUseCase } from "domain/usecases/ShowSchemaUseCase";

export function getCommand() {
    const compareCmd = command({
        name: "compare",
        description: "Compare pairs of DHIS2 data sets",
        args: {
            url1: option({
                type: string,
                long: "url",
                description: "http://USERNAME:PASSWORD@host1:8080",
            }),
            url2: option({
                type: optional(string),
                long: "url2",
                description: "http://USERNAME:PASSWORD@host2:8080",
            }),
            ignoreProperties: option({
                type: optional(StringsSeparatedByCommas),
                long: "ignore-properties",
                description: "PROP1,PROP2,...",
            }),
            dataSetIdsPairs: restPositionals({
                type: StringPairSeparatedByDash,
                displayName: "ID1-ID2",
                description: "Pairs of data set IDs to compare",
            }),
        },
        handler: async args => {
            if (_.isEmpty(args.dataSetIdsPairs)) throw new Error("Missing ID pairs: ID1-ID2");
            const api1 = new D2Api({ baseUrl: args.url1 });
            const api2 = args.url2 ? new D2Api({ baseUrl: args.url2 }) : api1;
            const dataSetsRepository1 = new DataSetsD2Repository(api1);
            const dataSetsRepository2 = new DataSetsD2Repository(api2);

            const showDiff = new ShowDataSetsDiffUseCase(dataSetsRepository1, dataSetsRepository2);
            const results = await showDiff.execute(args);
            const allEqual = _(results).every(result => result.type === "equal");
            const statusCode = allEqual ? 0 : 1;
            process.exit(statusCode);
        },
    });

    const showSchemaCmd = command({
        name: "show-schema",
        description: "Show DHIS2 data sets schema to be used in compare command",
        args: {},
        handler: async () => {
            const api = new D2Api({ baseUrl: "" });
            const dataSetsRepository = new DataSetsD2Repository(api);
            new ShowSchemaUseCase(dataSetsRepository).execute();
            process.exit(0);
        },
    });

    return subcommands({
        name: "datasets",
        cmds: { compare: compareCmd, "show-schema": showSchemaCmd },
    });
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
