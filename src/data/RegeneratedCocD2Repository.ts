import _ from "lodash";
import { D2Api, MetadataResponse } from "types/d2-api";
import { RegeneratedCoc } from "domain/entities/RegeneratedCoc";
import { Stats } from "domain/entities/Stats";
import { RegeneratedCocRepository } from "domain/repositories/RegeneratedCocRepository";
import { getInChunks } from "./dhis2-utils";
import { writeFileSync } from "fs";
import logger from "utils/log";

export class RegeneratedCocD2Repository implements RegeneratedCocRepository {
    constructor(private api: D2Api) {}

    async save(
        categoryOptionCombos: RegeneratedCoc[],
        options: { persist: boolean; persistInDisk: boolean }
    ): Promise<Stats> {
        const { persist, persistInDisk } = options;
        const allIds = categoryOptionCombos.map(coc => coc.id);

        const allResponses = await getInChunks(
            allIds,
            async (cocIds: string[]) => {
                const response = await this.api.models.categoryOptionCombos
                    .get({ filter: { id: { in: cocIds } }, fields: { $owner: true }, paging: false })
                    .getData();

                const cocsToSave = cocIds.map(cocId => {
                    const existingCoc = response.objects.find(coc => coc.id === cocId);

                    const cocToSave = categoryOptionCombos.find(coc => coc.id === cocId);

                    if (!cocToSave) throw new Error(`CategoryOptionCombo with id ${cocId} not found.`);

                    return {
                        ...(existingCoc ?? {}),
                        id: cocToSave.id,
                        name: cocToSave.name,
                        categoryCombo: { id: cocToSave.categoryCombo.id },
                        categoryOptions: _(cocToSave.categoryOptions)
                            .map(co => ({ id: co.id }))
                            .uniqBy(x => x.id)
                            .value(),
                    };
                });

                return this.api.metadata
                    .post(
                        { categoryOptionCombos: cocsToSave },
                        { importMode: persist ? "COMMIT" : "VALIDATE" }
                    )
                    .getData()
                    .then(res => {
                        const stats: Stats = { ...res.stats, errorMessage: "", recordsSkipped: [] };
                        return [{ stats: [stats], cocsToSave }];
                    })
                    .catch(err => {
                        const stats: Stats = {
                            ...Stats.empty(),
                            recordsSkipped: cocIds,
                            errorMessage: this.extractErrorMessageFromResponse(err),
                            ignored: cocIds.length,
                        };
                        return [{ stats: [stats], cocsToSave }];
                    });
            },
            {
                log: (processed, total) => {
                    logger.info(`Saving categoryOptionCombos: ${processed}/${total}`);
                },
            }
        );

        if (persistInDisk) {
            const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
            const filePath = `categoryOptionCombos-metadata-${currentTime}.json`;
            writeFileSync(
                filePath,
                JSON.stringify(
                    { categoryOptionCombos: allResponses.flatMap(response => response.cocsToSave) },
                    null,
                    2
                )
            );
        }

        return Stats.combine(allResponses.flatMap(response => response.stats));
    }

    async deleteByIds(cocIds: string[], options: { persist: boolean }): Promise<Stats> {
        const { persist } = options;
        const allStats = await getInChunks(
            cocIds,
            async (cocIdsChunks: string[]) => {
                return this.api.metadata
                    .post(
                        { categoryOptionCombos: cocIdsChunks.map(id => ({ id })) },
                        { importMode: persist ? "COMMIT" : "VALIDATE", importStrategy: "DELETE" }
                    )
                    .getData()
                    .then(res => {
                        const stats: Stats = { ...res.stats, errorMessage: "", recordsSkipped: [] };
                        return [stats];
                    })
                    .catch(err => {
                        const stats: Stats = {
                            ...Stats.empty(),
                            recordsSkipped: cocIds,
                            errorMessage: this.extractErrorMessageFromResponse(err),
                            ignored: cocIds.length,
                        };
                        return [stats];
                    });
            },
            {
                log: (processed, total) => {
                    logger.info(`Deleting categoryOptionCombos: ${processed}/${total}`);
                },
            }
        );

        return Stats.combine(allStats);
    }

    private extractErrorMessageFromResponse(err: MetadataResponse): string {
        const responseError = err as RequestMetadataError;
        const errorMessage = responseError.response?.data?.response?.typeReports
            .flatMap(x => x.objectReports)
            .flatMap(x => x.errorReports)
            .map(x => x.message)
            .join("\n");
        return errorMessage ?? "";
    }
}

type RequestMetadataError = { response?: { data?: { response?: MetadataResponse } } };
