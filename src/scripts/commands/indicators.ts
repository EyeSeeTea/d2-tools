import _ from "lodash";
import { command, option, optional, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api, IdsSeparatedByCommas, FilePath, periodYears } from "scripts/common";
import log from "utils/log";
import { IndicatorsD2Repository } from "data/IndicatorsD2Repository";
import { GetIndicatorNumDenIDsUseCase } from "domain/usecases/GetIndicatorNumDenIDsUseCase";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { GetIndicatorsDataElementsValuesReportUseCase } from "domain/usecases/GetIndicatorsDataElementsValuesReportUseCase";

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
                long: "file",
                short: "f",
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

                await indicatorsRepository.exportIndicatorsDataToCSV(result, args.path);

                process.exit(0);
            } catch (err: any) {
                log.error(err.message);
                process.exit(1);
            }
        },
    });

    const getRefMetadataValuesRep = command({
        name: "get-de-values-report",
        description:
            "Generate a CSV with the IDs, names and values of the dataElements referenced by the Indicators numerators and denominators.",
        args: {
            url: getApiUrlOption({ long: "url" }),
            indicatorsIDs: option({
                type: IdsSeparatedByCommas,
                long: "indicators",
                short: "i",
                description: "IND1,IND2,...",
            }),
            orgUnitsIDs: option({
                type: IdsSeparatedByCommas,
                long: "org-unit",
                short: "o",
                description: "ORG1",
            }),
            period: option({
                type: periodYears,
                long: "period",
                short: "op",
                description: "2000",
            }),
            path: option({
                type: optional(FilePath),
                long: "file",
                short: "f",
                description: "CSV output path (file or directory)",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const indicatorsRepository = new IndicatorsD2Repository(api);
            const dataSetsRepository = new DataSetsD2Repository(api);
            const DataValuesRepository = new DataValuesD2Repository(api);
            try {
                const getNumDenIDs = new GetIndicatorsDataElementsValuesReportUseCase(
                    indicatorsRepository,
                    dataSetsRepository,
                    DataValuesRepository
                );
                const result = await getNumDenIDs.execute(args);

                await indicatorsRepository.exportValuesReportToCSV(result, args.path);

                process.exit(0);
            } catch (err: any) {
                log.error(err.message);
                process.exit(1);
            }
        },
    });

    return subcommands({
        name: "datasets",
        cmds: { "get-ref-ids": getRefMetadata, "get-de-values-report": getRefMetadataValuesRep },
    });
}
