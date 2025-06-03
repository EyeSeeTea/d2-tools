import _ from "lodash";

import { Maybe } from "utils/ts-utils";
import { Async } from "domain/entities/Async";
import { MetadataModel, MetadataObject } from "domain/entities/MetadataObject";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import {
    ExclusiveMetadataItem,
    MetadataValidationResult,
    DiscrepancyMetadata,
    DiscrepancyValidationResult,
    METADATA_PROPERTIES_TO_IGNORE,
} from "domain/entities/MetadataValidationResult";

export class SyncMetadataUseCase {
    constructor(
        private metadataRepositoryMain: MetadataRepository,
        private metadataReplicaRepositories: MetadataRepository[]
    ) {}

    async execute(options: UseCaseOptions): Async<SyncMetadataReport> {
        const { modelsToCheck } = options;
        return this.validateMetadataByModel(modelsToCheck);
    }

    private async validateMetadataByModel(modelsToCheck: MetadataModel[]): Async<SyncMetadataReport> {
        const metadataReport: SyncMetadataReport = {
            exclusiveMetadata: [],
            metadataWithCodeDiscrepancies: [],
            metadataWithPropertiesDiscrepancies: [],
        };
        for (const model of modelsToCheck) {
            const mainObjects = await this.getObjects({ model, server: this.metadataRepositoryMain });

            const replicaObjects = await Promise.all(
                this.metadataReplicaRepositories.map(replicaServer =>
                    this.getObjects({ model, server: replicaServer })
                )
            );

            const exclusiveMetadata = this.findExclusiveMetadataWithSource(mainObjects, replicaObjects);

            const metadataWithCodeDiscrepancies = this.findCodeDiscrepanciesForModel(
                model,
                mainObjects,
                replicaObjects
            );

            const metadataWithPropertiesDiscrepancies = this.findFieldDiscrepanciesForModel(
                model,
                mainObjects,
                replicaObjects
            );

            metadataReport.exclusiveMetadata.push({
                model,
                exclusive: exclusiveMetadata,
            });
            metadataReport.metadataWithCodeDiscrepancies.push({
                model,
                items: metadataWithCodeDiscrepancies,
            });
            metadataReport.metadataWithPropertiesDiscrepancies.push({
                model,
                items: metadataWithPropertiesDiscrepancies,
            });
        }

        return metadataReport;
    }

    /*
      Metadata objects that exist only in one of the instances (based on IDs).
    */
    private findExclusiveMetadataWithSource(
        main: MetadataObject[],
        replicas: MetadataObject[][]
    ): ExclusiveMetadataItem[] {
        const metadataWithSource = [
            ...main.map(
                (metadataObject): ExclusiveMetadataItem => ({
                    object: metadataObject,
                    source: { type: "main" },
                })
            ),
            ...replicas.flatMap((list, replicaIndex) =>
                list.map(
                    (metadataObject): ExclusiveMetadataItem => ({
                        object: metadataObject,
                        source: { type: "replica", index: replicaIndex },
                    })
                )
            ),
        ];

        const metadataGroupedById = _.groupBy(metadataWithSource, item => item.object.id);
        const exclusiveMetadata = _.pickBy(metadataGroupedById, group => group.length === 1);

        return _(exclusiveMetadata)
            .map(group => group[0])
            .compact()
            .value();
    }

    private findCodeDiscrepanciesAgainstMain(
        model: MetadataModel,
        mainList: MetadataObject[],
        replicaList: MetadataObject[],
        replicaIdx: number
    ): DiscrepancyMetadata[] {
        const mainById = _(mainList)
            .filter(mainObj => mainObj.model === model)
            .keyBy(x => x.id)
            .value();

        return replicaList
            .filter(replicaObj => replicaObj.model === model)
            .filter(replicaObj => {
                const mainObj = mainById[replicaObj.id];
                if (!mainObj) return false;

                const codeMain = mainObj.code ?? "";
                const codeReplica = replicaObj.code ?? "";
                return codeMain !== codeReplica;
            })
            .map(replicaObj => {
                const mainObj = mainById[replicaObj.id]!;
                return {
                    model,
                    id: replicaObj.id,
                    mainObject: mainObj,
                    replicaObject: replicaObj,
                    replicaIndex: replicaIdx,
                    differingFields: ["code"],
                };
            });
    }

    /* 
        Detect objects with the same ID but different codes to flag discrepancies.
     */
    private findCodeDiscrepanciesForModel(
        model: MetadataModel,
        mainList: MetadataObject[],
        replicaLists: MetadataObject[][]
    ): DiscrepancyMetadata[] {
        return replicaLists.flatMap((replicaList, idx) =>
            this.findCodeDiscrepanciesAgainstMain(model, mainList, replicaList, idx)
        );
    }

    private compareFields(mainObj: MetadataObject, replicaObj: MetadataObject): string[] {
        const diffs: string[] = [];

        const mainAdd = mainObj.additionalFields ?? {};
        const replicaAdd = replicaObj.additionalFields ?? {};

        const allKeys = new Set<string>([...Object.keys(mainAdd), ...Object.keys(replicaAdd)]);

        for (const key of allKeys) {
            if (METADATA_PROPERTIES_TO_IGNORE.includes(key)) {
                continue;
            }
            const mainVal = mainAdd[key];
            const replicaVal = replicaAdd[key];
            if (!_.isEqual(mainVal, replicaVal)) {
                diffs.push(key);
            }
        }
        return diffs;
    }

    /* 
        Detect objects with the same ID but different in certain fields
     */
    private findFieldDiscrepanciesAgainstMain(
        model: MetadataModel,
        mainList: MetadataObject[],
        replicaList: MetadataObject[],
        replicaIdx: number
    ): DiscrepancyMetadata[] {
        const mainById = _.keyBy(mainList, "id");

        return _(replicaList)
            .map((replicaObj): Maybe<DiscrepancyMetadata> => {
                const mainObj = mainById[replicaObj.id];
                if (!mainObj) return undefined;

                const differingFields = this.compareFields(mainObj, replicaObj);
                if (differingFields.length === 0) return undefined;

                return {
                    model,
                    id: replicaObj.id,
                    mainObject: mainObj,
                    replicaObject: replicaObj,
                    replicaIndex: replicaIdx,
                    differingFields,
                };
            })
            .compact()
            .value();
    }

    private findFieldDiscrepanciesForModel(
        model: MetadataModel,
        mainList: MetadataObject[],
        replicaLists: MetadataObject[][]
    ): DiscrepancyMetadata[] {
        return replicaLists.flatMap((replicaList, idx) =>
            this.findFieldDiscrepanciesAgainstMain(model, mainList, replicaList, idx)
        );
    }

    private async getObjects(options: {
        model: MetadataModel;
        server: MetadataRepository;
    }): Async<MetadataObject[]> {
        const { model, server } = options;
        const allObjects: MetadataObject[] = [];

        let page = 1;
        while (true) {
            const { objects, pager } = await server.getPaginated({
                model: model,
                page: page,
            });
            allObjects.push(...objects.map(obj => ({ ...obj })));

            if (pager.page >= pager.pageCount) break;
            page++;
        }

        return allObjects;
    }
}

type UseCaseOptions = { modelsToCheck: string[] };

type MainAndReplicaObjects = {
    mainObjects: MetadataObject[];
    replicaObjects: MetadataObject[][];
};

export type SyncMetadataReport = {
    exclusiveMetadata: MetadataValidationResult[];
    metadataWithCodeDiscrepancies: DiscrepancyValidationResult[];
    metadataWithPropertiesDiscrepancies: DiscrepancyValidationResult[];
};
