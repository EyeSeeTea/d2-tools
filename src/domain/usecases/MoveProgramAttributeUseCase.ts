import _ from "lodash";
import { Async } from "domain/entities/Async";
import { MoveProgramAttributeOptions, ProgramsRepository } from "domain/repositories/ProgramsRepository";
import logger from "utils/log";
import { Attribute } from "domain/entities/ProgramAttributes";
import { Maybe } from "utils/ts-utils";

export class MoveProgramAttributeUseCase {
    constructor(private programRepository: ProgramsRepository) {}

    async execute(options: MoveProgramAttributeOptions): Async<void> {
        const teis = await this.programRepository.getAll(options);

        const teisWithCopyValues = _(teis)
            .map(tei => {
                const fromAttribute = tei.attributes.find(attr => attr.attribute === options.fromAttributeId);
                if (!fromAttribute) return undefined;
                const toAttribute = tei.attributes.find(attr => attr.attribute === options.toAttributeId);

                return {
                    ...tei,
                    attributes: toAttribute
                        ? this.generateAttributes(tei.attributes, fromAttribute, toAttribute)
                        : [
                              ...this.generateAttributes(tei.attributes, fromAttribute, toAttribute),
                              {
                                  attribute: options.toAttributeId,
                                  value: fromAttribute.value,
                                  storedBy: fromAttribute.storedBy,
                              },
                          ],
                };
            })
            .compact()
            .value();

        logger.info(`TEIS to modify: ${teisWithCopyValues.length}`);
        const stats = await this.programRepository.saveAttributes(teisWithCopyValues);
        logger.info(JSON.stringify(stats, null, 4));
    }

    private getAttributeValue(
        attribute: Attribute,
        fromAttribute: Attribute,
        toAttribute: Maybe<Attribute>
    ): string {
        if (attribute.attribute === fromAttribute.attribute) {
            return "";
        } else if (attribute.attribute === toAttribute?.attribute) {
            return fromAttribute.value;
        } else {
            return attribute.value;
        }
    }

    private generateAttributes(
        attributes: Attribute[],
        fromAttribute: Attribute,
        toAttribute: Maybe<Attribute>
    ): Attribute[] {
        return attributes.map(attribute => {
            return {
                ...attribute,
                value: this.getAttributeValue(attribute, fromAttribute, toAttribute),
            };
        });
    }
}
