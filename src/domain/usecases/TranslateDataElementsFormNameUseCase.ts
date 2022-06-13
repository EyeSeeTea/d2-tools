import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { FieldTranslationsRepository } from "domain/repositories/FieldTranslationsRepository";
import { Translation } from "domain/entities/Translation";
import { DataElement } from "domain/entities/DataElement";
import log from "utils/log";

export class TranslateDataElementsFormNameUseCase {
    constructor(
        private dataElementsRepository: DataElementsRepository,
        private fieldTranslationsRepository: FieldTranslationsRepository
    ) {}

    async execute(options: { inputFile: string; post: boolean }): Async<void> {
        const fieldTranslations = await this.fieldTranslationsRepository.get({
            translatableField: "formName",
            inputFile: options.inputFile,
            skipHeaders: ["shortName"],
        });

        const dataElements = await this.dataElementsRepository.get();
        const dataElementsByName = _.keyBy(dataElements, de => de.name);

        const dataElementsUpdated = _(fieldTranslations)
            .map((fieldTranslation): DataElement | null => {
                const dataElement = dataElementsByName[fieldTranslation.identifier];

                if (!dataElement) {
                    log.warn(`Data element with name ${fieldTranslation.identifier} not found in instance`);
                    return null;
                } else {
                    return {
                        ...dataElement,
                        formName: fieldTranslation.value,
                        translations: this.mergeTranslations(
                            dataElement.translations,
                            fieldTranslation.translations.map(t => ({ ...t, property: "FORM_NAME" }))
                        ),
                    };
                }
            })
            .compact()
            .sortBy(de => de.id)
            .value();

        const dataElementsWithChanges = _.differenceWith(dataElementsUpdated, dataElements, _.isEqual);
        log.info(`Payload: ${dataElementsWithChanges.length} data elements to post`);

        if (options.post) {
            await this.dataElementsRepository.save(dataElementsWithChanges);
        } else {
            const payloadPath = "translate-dataelements.json";
            log.info(`Payload saved: ${payloadPath}`);
            const payload = { dataElements: dataElementsWithChanges };
            const contents = JSON.stringify(payload, null, 4);
            fs.writeFileSync(payloadPath, contents);
        }
    }

    private mergeTranslations(translations1: Translation[], translations2: Translation[]): Translation[] {
        return _(translations1)
            .map(translation1 => {
                const translation2 = translations2.find(t2 => {
                    return translation1.locale === t2.locale && translation1.property === t2.property;
                });
                return translation2 || translation1;
            })
            .concat(translations2)
            .uniqBy(translation => [translation.locale, translation.property].join("."))
            .value();
    }
}
