import _ from "lodash";
import { command, option, optional, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api, IdsSeparatedByCommas, FilePath, periodYears } from "scripts/common";
import log from "utils/log";
import { IndicatorsD2Repository } from "data/IndicatorsD2Repository";
import { DataSetsD2Repository } from "data/DataSetsD2Repository";
import { DataValuesD2Repository } from "data/DataValuesD2Repository";
import { DataElementsD2Repository } from "data/DataElementsD2Repository";
import { CategoryOptionCombosD2Repository } from "data/CategoryOptionCombosD2Repository";
import { GetIndicatorNumDenIDsUseCase } from "domain/usecases/GetIndicatorNumDenIDsUseCase";
import { GetIndicatorsDataElementsValuesReportUseCase } from "domain/usecases/GetIndicatorsDataElementsValuesReportUseCase";
import { exportIndicatorsDataIdsToCSVUseCase } from "domain/usecases/ExportIndicatorsDataIdsToCSVUseCase";
import { exportValuesReportToCSVUseCase } from "domain/usecases/ExportValuesReportToCSVUseCase";

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
                description: "IND_ID1,IND_ID2,...",
            }),
            dataSetFilterList: option({
                type: optional(IdsSeparatedByCommas),
                long: "ds-filter",
                short: "i",
                description: "DS_ID1,DS_ID2,...",
            }),
            path: option({
                type: optional(FilePath),
                long: "file",
                short: "f",
                description: "CSV output path (file or directory), defaults to ./indicatorsRefIDs.csv",
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

                const exportIndicatorsDataIdsToCSV = new exportIndicatorsDataIdsToCSVUseCase();
                await exportIndicatorsDataIdsToCSV.execute(result, args.path);

                process.exit(0);
            } catch (err: any) {
                log.error(err.stack);
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
                description: "IND_ID1,IND_ID2,...",
            }),
            orgUnitsIDs: option({
                type: IdsSeparatedByCommas,
                long: "org-unit",
                short: "o",
                description: "ORG_UNIT_ID1,ORG_UNIT_ID2,...",
            }),
            period: option({
                type: periodYears,
                long: "period",
                short: "op",
                description: "YEAR1,YEAR2,...",
            }),
            dataSetFilterList: option({
                type: optional(IdsSeparatedByCommas),
                long: "ds-filter",
                short: "i",
                description: "DS_ID1,DS_ID2,...",
            }),
            path: option({
                type: optional(FilePath),
                long: "file",
                short: "f",
                description: "CSV output path (file or directory), defaults to ./indicatorsValuesReport.csv",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const indicatorsRepository = new IndicatorsD2Repository(api);
            const dataSetsRepository = new DataSetsD2Repository(api);
            const DataValuesRepository = new DataValuesD2Repository(api);
            const dataElementsRepository = new DataElementsD2Repository(api);
            const categoryOptionCombosRepository = new CategoryOptionCombosD2Repository(api);

            try {
                const getNumDenIDs = new GetIndicatorsDataElementsValuesReportUseCase(
                    indicatorsRepository,
                    dataSetsRepository,
                    DataValuesRepository,
                    dataElementsRepository,
                    categoryOptionCombosRepository
                );
                const result = await getNumDenIDs.execute(args);

                const exportValuesReportToCSV = new exportValuesReportToCSVUseCase();
                await exportValuesReportToCSV.execute(result, args.path);

                process.exit(0);
            } catch (err: any) {
                log.error(err.stack);
                process.exit(1);
            }
        },
    });

    return subcommands({
        name: "datasets",
        cmds: { "get-ref-ids": getRefMetadata, "get-de-values-report": getRefMetadataValuesRep },
    });
}
