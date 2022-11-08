import _ from "lodash";
import { command, option, optional, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api, IdsSeparatedByCommas, FilePath } from "scripts/common";
import log from "utils/log";
import { IndicatorsD2Repository } from "data/IndicatorsD2Repository";
import { GetIndicatorNumDenIDsUseCase } from "domain/usecases/GetIndicatorNumDenIDsUseCase";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";

export function getCommand() {
    const getRefMetadata = command({
        name: "get-ref-ids",
        description: "Get the IDs referenced by the Indicators numerators and denominators.",
        args: {
            url: getApiUrlOption({ long: "url" }),
            indicatorsIDs: option({
                type: IdsSeparatedByCommas,
                long: "indicators",
                short: "i",
                description: "IND1,IND2,...",
            }),
            path: option({
                type: optional(FilePath),
                long: "path",
                short: "p",
                description: "CSV output path (file or directory)",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const indicatorsRepository = new IndicatorsD2Repository(api);
            const dataSetsRepository = new DataSetsD2Repository(api);
            try {
                const getNumDenIDs = new GetIndicatorNumDenIDsUseCase(
                    indicatorsRepository,
                    dataSetsRepository
                );
                const result = await getNumDenIDs.execute(args);

                await indicatorsRepository.exportToCSV(result, args.path);

                log.debug(JSON.stringify(result));

                process.exit(0);
            } catch (err: any) {
                log.error(err.message);
                process.exit(1);
            }
        },
    });

    return subcommands({
        name: "datasets",
        cmds: { "get-ref-ids": getRefMetadata },
    });
}
