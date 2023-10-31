import _ from "lodash";
import { Async } from "domain/entities/Async";
import logger from "utils/log";
import { AttributeValue, TrackedEntity } from "domain/entities/TrackedEntity";
import { Maybe } from "utils/ts-utils";
import {
    TrackedEntityFilterParams,
    TrackedEntityRepository,
} from "domain/repositories/TrackedEntityRepository";

export class MoveProgramAttributeUseCase {
    constructor(private trackedEntityRepository: TrackedEntityRepository) {}

    async execute(options: TrackedEntityFilterParams): Async<void> {
        const teis = await this.trackedEntityRepository.getAll(options);

        const teisWithCopyValues = _(teis)
            .map((tei): Maybe<TrackedEntity> => {
                const fromAttribute = tei.attributes.find(
                    attr => attr.attributeId === options.fromAttributeId
                );
                if (!fromAttribute) return undefined;
                const toAttribute = tei.attributes.find(attr => attr.attributeId === options.toAttributeId);

                const attributes = this.generateAttributes(tei.attributes, fromAttribute, toAttribute);

                return {
                    ...tei,
                    attributes: toAttribute
                        ? attributes
                        : [
                              ...attributes,
                              {
                                  attributeId: options.toAttributeId,
                                  value: fromAttribute.value,
                                  storedBy: fromAttribute.storedBy,
                              },
                          ],
                };
            })
            .compact()
            .value();

        logger.info(`TEIS to modify: ${teisWithCopyValues.length}`);
        const stats = await this.trackedEntityRepository.saveAttributes(teisWithCopyValues);
        logger.info(JSON.stringify(stats, null, 4));
    }

    private getAttributeValue(
        attribute: AttributeValue,
        fromAttribute: AttributeValue,
        toAttribute: Maybe<AttributeValue>
    ): string {
        if (attribute.attributeId === fromAttribute.attributeId) {
            return "";
        } else if (attribute.attributeId === toAttribute?.attributeId) {
            return fromAttribute.value;
        } else {
            return attribute.value;
        }
    }

    private generateAttributes(
        attributes: AttributeValue[],
        fromAttribute: AttributeValue,
        toAttribute: Maybe<AttributeValue>
    ): AttributeValue[] {
        return attributes.map(attribute => {
            return {
                ...attribute,
                value: this.getAttributeValue(attribute, fromAttribute, toAttribute),
            };
        });
    }
}
