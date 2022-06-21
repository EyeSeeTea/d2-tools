import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { FieldTranslationsRepository } from "domain/repositories/FieldTranslationsRepository";
import { Translation } from "domain/entities/Translation";
import { DataElement } from "domain/entities/DataElement";
import log from "utils/log";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import { LocalesRepository } from "domain/repositories/LocalesRepository";

interface Options {
    inputFile: string;
    savePayload?: string;
    post: boolean;
}

export class TranslateDataElementsFormNameUseCase {
    constructor(
        private dataElementsRepository: DataElementsRepository,
        private localesRepository: LocalesRepository,
        private fieldTranslationsRepository: FieldTranslationsRepository
    ) {}

    async execute(options: Options): Async<void> {
        const { savePayload } = options;
        const locales = await this.localesRepository.get();

        const fieldTranslations = await this.fieldTranslationsRepository.get({
            translatableField: "formName",
            inputFile: options.inputFile,
            skipHeaders: ["shortName"],
            locales: locales.map(locale => locale.locale),
        });

        const dataElements = await this.dataElementsRepository.get();
        const dataElementsUpdated = this.getUpdatedDataElements(dataElements, fieldTranslations);
        const dataElementsWithChanges = _.differenceWith(dataElementsUpdated, dataElements, _.isEqual);
        log.info(`Payload: ${dataElementsWithChanges.length} data elements to post`);

        if (savePayload) {
            log.info(`Payload saved: ${savePayload}`);
            const payload = { dataElements: dataElementsWithChanges };
            const contents = JSON.stringify(payload, null, 4);
            fs.writeFileSync(savePayload, contents);
        }

        if (options.post) {
            await this.dataElementsRepository.save(dataElementsWithChanges);
        }
    }

    private getUpdatedDataElements(
        dataElements: DataElement[],
        fieldTranslations: FieldTranslations<"formName">[]
    ) {
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

        return dataElementsUpdated;
    }

    private mergeTranslations(translations1: Translation[], translations2: Translation[]): Translation[] {
        // Locales may have LANGUAGE or LANGUAGE_COUNTRY, considered them equal if language is equal
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
