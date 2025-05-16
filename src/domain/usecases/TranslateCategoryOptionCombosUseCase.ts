import _, { property } from "lodash";
import { Id } from "domain/entities/Base";
import { CategoryOptionCombo } from "domain/entities/CategoryOptionCombo";
import { CategoryOptionCombosRepository } from "domain/repositories/CategoryOptionCombosRepository";
import logger from "utils/log";

export class TranslateCategoryOptionCombosUseCase {
    constructor(private categoryOptionCombosRepository: CategoryOptionCombosRepository) {}

    async execute(options: { categoryComboIds?: Id[]; post: boolean }): Promise<Result> {
        const { categoryComboIds } = options;
        logger.info(`Translate COCs for category combos: ${categoryComboIds?.join(", ") || "all"}`);

        let page = 1;
        let results: Result[] = [];

        while (true) {
            logger.debug(`Fetching category option combos page ${page}`);
            const cocs = await this.categoryOptionCombosRepository.get({
                pagination: { page: page, pageSize: 1000 },
                categoryComboIds: categoryComboIds,
            });

            if (_.isEmpty(cocs)) break;

            const cocsTranslatedToSave = _(cocs)
                .map(coc => {
                    const cocTranslated = this.translateCoc(coc);

                    const alreadyTranslated = _.isEqual(
                        _.sortBy(coc.translations, coc => [coc.locale, coc.property, coc.value].join(".")),
                        _.sortBy(cocTranslated.translations, coc =>
                            [coc.locale, coc.property, coc.value].join(".")
                        )
                    );

                    return alreadyTranslated ? undefined : cocTranslated;
                })
                .compact()
                .value();

            logger.debug(
                `Found ${cocs.length} category option combos, ${cocsTranslatedToSave.length} need to be translated`
            );

            function getTranslationsInfo(coc: CategoryOptionCombo): string {
                return (
                    coc.translations
                        .map(translation => `${translation.locale}=${translation.value}`)
                        .join(",") || "NO-TRANSLATIONS"
                );
            }

            const cocsById = _.keyBy(cocs, coc => coc.id);

            if (!_.isEmpty(cocsTranslatedToSave)) {
                const lines = cocsTranslatedToSave.map(
                    (coc, index) =>
                        `${(index + 1).toString().padStart(3, "0")} - ${coc.id} - ${getTranslationsInfo(
                            cocsById[coc.id]!
                        )} -> ${getTranslationsInfo(coc)}`
                );
                lines.forEach(line => logger.debug(line));
            }

            if (options.post) {
                await this.categoryOptionCombosRepository.save(cocsTranslatedToSave);
            }

            results.push({
                total: cocs.length,
                newlyTranslated: cocsTranslatedToSave.length,
            });

            page++;
        }

        return results.reduce(
            (acc, result) => ({
                total: acc.total + result.total,
                newlyTranslated: acc.newlyTranslated + result.newlyTranslated,
            }),
            { total: 0, newlyTranslated: 0 }
        );
    }

    private translateCoc(coc: CategoryOptionCombo): CategoryOptionCombo {
        const localesUsedInTranslations = _(coc.categoryOptions)
            .flatMap(categoryOption => categoryOption.translations)
            .filter(translation => translation.property === "NAME")
            .map(translation => translation.locale)
            .uniq()
            .value();

        const cocTranslationsFromOptions = localesUsedInTranslations.map(locale => {
            const parts = coc.categoryOptions.map(categoryOption => {
                const translationForLocale = categoryOption.translations.find(
                    translation => translation.property === "NAME" && translation.locale === locale
                );

                return translationForLocale?.value || categoryOption.name;
            });

            return { locale: locale, property: "NAME", value: parts.join(", ") };
        });

        return { ...coc, translations: cocTranslationsFromOptions };
    }
}

export type Result = {
    total: number;
    newlyTranslated: number;
};
