import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { FieldTranslationsRepository } from "domain/repositories/FieldTranslationsRepository";
import { getLocaleLanguage, Translation } from "domain/entities/Translation";
import { DataElement } from "domain/entities/DataElement";
import log from "utils/log";
import { CountryIso3166_1_alpha2, LocaleIso839_1 } from "domain/entities/FieldTranslations";

export class TranslateDataElementsFormNameUseCase {
    constructor(
        private dataElementsRepository: DataElementsRepository,
        private fieldTranslationsRepository: FieldTranslationsRepository
    ) {}

    async execute(options: { inputFile: string; post: boolean }): Async<void> {
        const countryMapping: Record<LocaleIso839_1, CountryIso3166_1_alpha2> = {
            ro: "RO",
            th: "TH",
            mn: "MN",
            pl: "PL",
        };

        // TODO: this.localesRepository.get() -> use to build countryMappingd
        // pass to fieldTranslationsRepository
        const fieldTranslations = await this.fieldTranslationsRepository.get({
            translatableField: "formName",
            inputFile: options.inputFile,
            skipHeaders: ["shortName"],
            countryMapping,
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

        const payloadPath = "translate-dataelements.json";
        log.info(`Payload saved: ${payloadPath}`);
        const payload = { dataElements: dataElementsWithChanges };
        const contents = JSON.stringify(payload, null, 4);
        fs.writeFileSync(payloadPath, contents);

        if (options.post) {
            await this.dataElementsRepository.save(dataElementsWithChanges);
        }
    }

    private mergeTranslations(translations1: Translation[], translations2: Translation[]): Translation[] {
        const getLang = getLocaleLanguage;

        // Locales may have LANGUAGE or LANGUAGE_COUNTRY, considered them equal if language is equal
        return _(translations1)
            .map(translation1 => {
                const translation2 = translations2.find(t2 => {
                    return (
                        getLang(translation1.locale) === getLang(t2.locale) &&
                        translation1.property === t2.property
                    );
                });
                return translation2 || translation1;
            })
            .concat(translations2)
            .uniqBy(translation => [getLang(translation.locale), translation.property].join("."))
            .value();
    }
}
