import fs from "fs";
import _ from "lodash";
import { Async } from "domain/entities/Async";
import { getId } from "domain/entities/Base";
import { MetadataModel, MetadataObject } from "domain/entities/MetadataObject";
import { MetadataRepository } from "domain/repositories/MetadataRepository";
import logger from "utils/log";

export class SyncValidateUseCase {
    constructor(
        private metadataRepository1: MetadataRepository,
        private metadataRepository2: MetadataRepository
    ) {}

    async execute(options: Options): Async<void> {
        const res: SyncValidateResponse = {};

        for (const model of options.modelsToCheck) {
            const objects1 = await this.getObjects({ model, repo: this.metadataRepository1 });
            const objects2 = await this.getObjects({ model, repo: this.metadataRepository2 });

            const missingObjects = this.checkObjectsOnlyInOneOfTheInstances(objects1, objects2, model);
            const mismatchIdCode = this.checkObjectsIdCodeMismatch(objects1, objects2);

            res[model] = {
                missingObjects: missingObjects,
                mismatchIdCode: mismatchIdCode,
            };
        }

        const outputReport = `sync-validate.json`;
        fs.writeFileSync(outputReport, JSON.stringify(res, null, 4));
        logger.info(`Output report: ${outputReport}`);
    }

    /* Private */

    private async getObjects(options: {
        model: MetadataModel;
        repo: MetadataRepository;
    }): Async<MetadataObjectWithInstance[]> {
        const { model, repo } = options;
        const allObjects: MetadataObjectWithInstance[] = [];
        const instance: Instance = repo === this.metadataRepository1 ? 1 : 2;

        for (let page = 1; ; page++) {
            logger.debug(`Get objects for instance=${instance}, model=${model}, page=${page}`);
            const { objects, pager } = await repo.getPaginated({
                model: model,
                page: page,
            });
            allObjects.push(...objects.map(obj => ({ ...obj, instance: instance })));

            if (pager.page >= pager.pageCount) break;
        }

        return allObjects;
    }

    private checkObjectsIdCodeMismatch(
        objects1: MetadataObjectWithInstance[],
        objects2: MetadataObjectWithInstance[]
    ): MetadataObjectWithInstance[] {
        const mismatchIdsCode = _(objects1)
            .concat(objects2)
            .filter(obj => Boolean(obj.code))
            .groupBy(obj => obj.code)
            .toPairs()
            .map(([code, objectsWithSameCode]) => {
                const uniqIdsCount = _(objectsWithSameCode).map(getId).uniq().size();
                return uniqIdsCount > 1 ? { code, objectsWithSameCode } : null;
            })
            .compact()
            .value();

        logger.info(`# Check ID/code mismatch: ${mismatchIdsCode.length}`);

        mismatchIdsCode.forEach(({ code, objectsWithSameCode }) => {
            logger.info(`Objects with same code (${code}) do not match IDs:`);
            _(objectsWithSameCode)
                .sortBy(obj => obj.instance)
                .forEach(object => logger.info(`  - ${this.renderObject(object)}`));
        });

        return _(mismatchIdsCode)
            .flatMap(o => o.objectsWithSameCode)
            .value();
    }

    private checkObjectsOnlyInOneOfTheInstances(
        objects1: MetadataObjectWithInstance[],
        objects2: MetadataObjectWithInstance[],
        model: string
    ): MetadataObjectWithInstance[] {
        const objectsOnlyInInstance1 = _.differenceBy(objects1, objects2, getId);
        const objectsOnlyInInstance2 = _.differenceBy(objects2, objects1, getId);

        logger.info(`${model} in instance 1: ${objects1.length}`);
        logger.info(`${model} in instance 2: ${objects2.length}`);

        logger.info(`# Only in instance 1 (count): ${objectsOnlyInInstance1.length}`);
        objectsOnlyInInstance1.forEach(object => logger.debug(`Only in: ${this.renderObject(object)}`));

        logger.info(`# Only in instance 2 (count): ${objectsOnlyInInstance2.length}`);
        objectsOnlyInInstance2.forEach(object => logger.debug(`Only in: ${this.renderObject(object)}`));

        return _.concat(objectsOnlyInInstance1, objectsOnlyInInstance2);
    }

    private renderObject(obj: MetadataObjectWithInstance): string {
        return _.compact([
            `[instance=${obj.instance}]`,
            ` ${obj.model}/${obj.id}`,
            ` - name="${obj.name}"`,
            obj.code ? ` - code="${obj.code}"` : "",
        ]).join("");
    }
}

interface Options {
    modelsToCheck: string[];
}

type Instance = 1 | 2;

interface MetadataObjectWithInstance extends MetadataObject {
    instance: Instance;
}

type SyncValidateResponse = Record<
    MetadataModel,
    {
        missingObjects: MetadataObjectWithInstance[];
        mismatchIdCode: MetadataObjectWithInstance[];
    }
>;
