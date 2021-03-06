import _ from "lodash";
import { command, string, option, restPositionals, optional, subcommands } from "cmd-ts";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { ShowDataSetsDiffUseCase } from "domain/usecases/ShowDataSetsDiffUseCase";
import { D2Api } from "types/d2-api";
import { ShowSchemaUseCase } from "domain/usecases/ShowSchemaUseCase";
import {
    getApiUrlOption,
    getD2Api,
    StringPairSeparatedByDash,
    StringsSeparatedByCommas,
} from "scripts/common";

export function getCommand() {
    const compareCmd = command({
        name: "compare",
        description: "Compare pairs of DHIS2 data sets",
        args: {
            url1: getApiUrlOption({ long: "url" }),
            url2: option({
                type: optional(string),
                long: "url2",
                description: "http://USERNAME:PASSWORD@HOST:PORT",
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
            const api1 = getD2Api(args.url1);
            const api2 = args.url2 ? getD2Api(args.url2) : api1;
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
