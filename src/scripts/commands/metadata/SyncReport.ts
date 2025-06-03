import { SyncMetadataReport } from "domain/usecases/SyncMetadataUseCase";
import { createArrayCsvStringifier } from "csv-writer";
import { writeFileSync } from "fs";
import logger from "utils/log";

export class SyncReport {
    public generateCsvReports(syncReport: SyncMetadataReport): void {
        const metadataExclusiveCsvContent = this.generateExclusiveMetadataCsv(syncReport);
        this.generateCsvFileAndLog(
            metadataExclusiveCsvContent,
            "exclusive_metadata.csv",
            "Exclusive metadata CSV report"
        );

        const metadataDiscrepanciesCsvContent = this.generateDiscrepanciesMetadataCsv(syncReport);

        this.generateCsvFileAndLog(
            metadataDiscrepanciesCsvContent,
            "discrepancies_metadata.csv",
            "Discrepancies metadata CSV report"
        );

        const metadataPropertiesDiscrepanciesCsvContent =
            this.generatePropertiesDiscrepanciesMetadataCsv(syncReport);

        this.generateCsvFileAndLog(
            metadataPropertiesDiscrepanciesCsvContent,
            "properties_discrepancies_metadata.csv",
            "Properties discrepancies metadata CSV report"
        );
    }

    private generatePropertiesDiscrepanciesMetadataCsv(syncReport: SyncMetadataReport): string {
        const propertiesDiscrepanciesCsvStringifier = createArrayCsvStringifier({
            header: [
                "model",
                "id",
                "Code in Metadata Server",
                "Code in Replica Server",
                "Replica Server Number",
                "Diff Fields",
            ],
        });
        const header = propertiesDiscrepanciesCsvStringifier.getHeaderString();
        const rows = syncReport.metadataWithPropertiesDiscrepancies.flatMap(result =>
            result.items
                .map(item =>
                    propertiesDiscrepanciesCsvStringifier.stringifyRecords([
                        [
                            item.model,
                            item.id,
                            item.mainObject.code,
                            item.replicaObject.code ?? "",
                            item.replicaIndex + 1,
                            item.differingFields.join(", "),
                        ],
                    ])
                )
                .join("")
        );
        return [header, ...rows].join("");
    }

    private generateCsvFileAndLog(csvContent: string, fileName: string, message: string): void {
        if (csvContent) {
            writeFileSync(fileName, csvContent, { encoding: "utf8" });
        }
        logger.info(`${message} generated: ${fileName}`);
    }

    private generateDiscrepanciesMetadataCsv(syncReport: SyncMetadataReport): string {
        const discrepanciesCsvStringifier = createArrayCsvStringifier({
            header: [
                "model",
                "id",
                "Code in Metadata Server",
                "Code in Replica Server",
                "Replica Server Number",
            ],
        });
        const header = discrepanciesCsvStringifier.getHeaderString();
        const rows = syncReport.metadataWithCodeDiscrepancies.flatMap(result =>
            result.items
                .map(item =>
                    discrepanciesCsvStringifier.stringifyRecords([
                        [
                            item.model,
                            item.id,
                            item.mainObject.code,
                            item.replicaObject.code ?? "",
                            item.replicaIndex + 1,
                        ],
                    ])
                )
                .join("")
        );
        return [header, ...rows].join("");
    }

    private generateExclusiveMetadataCsv(syncReport: SyncMetadataReport): string {
        const exclusiveCsvStringifier = createArrayCsvStringifier({
            header: ["model", "id", "name", "code", "server"],
        });
        const header = exclusiveCsvStringifier.getHeaderString();
        const rows = syncReport.exclusiveMetadata.flatMap(result =>
            result.exclusive
                .map(item =>
                    exclusiveCsvStringifier.stringifyRecords([
                        [
                            item.object.model,
                            item.object.id,
                            item.object.name,
                            item.object.code ?? "",
                            item.source.type === "replica" ? `Replica ${item.source.index + 1}` : "metadata",
                        ],
                    ])
                )
                .join("")
        );
        return [header, ...rows].join("");
    }
}
