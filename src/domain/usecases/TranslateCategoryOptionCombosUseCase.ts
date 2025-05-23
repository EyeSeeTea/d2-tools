import _ from "lodash";
import { Id } from "domain/entities/Base";
import { CategoryOptionCombo } from "domain/entities/CategoryOptionCombo";
import { CategoryOptionCombosRepository } from "domain/repositories/CategoryOptionCombosRepository";
import logger from "utils/log";
import { Pager } from "domain/entities/Pager";

export class TranslateCategoryOptionCombosUseCase {
    constructor(private categoryOptionCombosRepository: CategoryOptionCombosRepository) {}

    async execute(options: { categoryComboIds?: Id[]; post: boolean }): Promise<TranslateCocsResult> {
        const { categoryComboIds } = options;
        logger.info(`Translate COCs for category combos: ${categoryComboIds?.join(", ") || "all"}`);

        const results = await runForPage(async page => {
            const { objects: cocs, pager } = await this.getCocs(page, categoryComboIds);
            const cocsTranslated = this.getCocsTranslated(cocs);

            this.logTranslationsInfo(cocs, cocsTranslated);

            const result: TranslateCocsResult = {
                total: cocs.length,
                untranslated: cocsTranslated.length,
            };

            if (options.post) {
                await this.saveCocs(cocsTranslated);
            }

            return { result: result, pager: pager };
        });

        return mergeResults(results);
    }

    private logTranslationsInfo(cocs: CategoryOptionCombo[], cocsTranslated: CategoryOptionCombo[]) {
        logger.info(`${cocs.length} category option combos (${cocsTranslated.length} untranslated)`);

        if (_.isEmpty(cocsTranslated)) return;

        const cocsById = _.keyBy(cocs, coc => coc.id);

        const lines = cocsTranslated.map((coc, index) => {
            const existingCoc = cocsById[coc.id];
            if (!existingCoc) throw new Error(`COC not found: ${coc.id}`);

            return [
                `TO UPDATE: ${(index + 1).toString().padStart(3, "0")}:`,
                `coc.id="${coc.id}" |`,
                `translations = ${getInfo(existingCoc)} -> ${getInfo(coc)}`,
            ].join(" ");
        });
        lines.forEach(line => logger.debug(line));
    }

    private getCocsTranslated(cocs: CategoryOptionCombo[]) {
        function sort(
            translations: CategoryOptionCombo["translations"]
        ): CategoryOptionCombo["translations"] {
            return _.sortBy(translations, translation =>
                [translation.locale, translation.property, translation.value].join(".")
            );
        }

        return _(cocs)
            .reject(coc => coc.name === "default") // default COC is not translatable
            .map(coc => {
                const cocTranslated = this.translateCoc(coc);
                const equalName = coc.name === cocTranslated.name;
                const equalTranslations = _.isEqual(sort(coc.translations), sort(cocTranslated.translations));
                const alreadyTranslated = equalName && equalTranslations;
                return alreadyTranslated ? undefined : cocTranslated;
            })
            .compact()
            .value();
    }

    private async saveCocs(cocsTranslated: CategoryOptionCombo[]) {
        if (_.isEmpty(cocsTranslated)) return;
        logger.debug(`Saving ${cocsTranslated.length} category option combos`);
        await this.categoryOptionCombosRepository.save(cocsTranslated);
        logger.info(`Saved ${cocsTranslated.length} category option combos`);
    }

    private async getCocs(page: number, categoryComboIds: string[] | undefined) {
        logger.info(`Fetching category option combos: page=${page}`);

        return this.categoryOptionCombosRepository.get({
            pagination: { page: page, pageSize: 10000 },
            categoryComboIds: categoryComboIds,
        });
    }

    /* Assign translations to Coc from its categoryOptions + set English name */
    private translateCoc(categoryOptionCombo: CategoryOptionCombo): CategoryOptionCombo {
        // Return category option combo untranslated when it has no options.
        // This happens when the options order could not be determined from the category combo.
        if (_.isEmpty(categoryOptionCombo.categoryOptions)) return categoryOptionCombo;

        const localesUsedInTranslations = _(categoryOptionCombo.categoryOptions)
            .flatMap(categoryOption => categoryOption.translations)
            .filter(translation => translation.property === "NAME")
            .map(translation => translation.locale)
            .uniq()
            .value();

        const translationsFromOptions = localesUsedInTranslations.map(locale => {
            const parts = categoryOptionCombo.categoryOptions.map(categoryOption => {
                const translationForLocale = categoryOption.translations.find(
                    translation => translation.property === "NAME" && translation.locale === locale
                );

                if (!translationForLocale) {
                    logger.debug(
                        `Category option id="${categoryOption.id}", name="${categoryOption.name}" ` +
                            `does not have a translation for locale "${locale}", using its name`
                    );
                    return categoryOption.name;
                } else {
                    return translationForLocale.value;
                }
            });

            return { locale: locale, property: "NAME", value: parts.join(", ") };
        });

        const englishNameFromOptions = categoryOptionCombo.categoryOptions
            .map(categoryOption => {
                const translationForEnglish = categoryOption.translations.find(
                    translation => translation.property === "NAME" && translation.locale.startsWith("en")
                );

                return translationForEnglish?.value || categoryOption.name;
            })
            .join(", ");

        return {
            ...categoryOptionCombo,
            name: englishNameFromOptions,
            translations: translationsFromOptions,
        };
    }
}

export type TranslateCocsResult = {
    total: number;
    untranslated: number;
};

function mergeResults(results: TranslateCocsResult[]): TranslateCocsResult {
    return results.reduce(
        (acc, result) => ({
            total: acc.total + result.total,
            untranslated: acc.untranslated + result.untranslated,
        }),
        { total: 0, untranslated: 0 }
    );
}

function getInfo(coc: CategoryOptionCombo): string {
    return (
        _(coc.translations)
            .map(translation => `${translation.locale}="${translation.value}"`)
            .value()
            .join(", ") || "[EMPTY]"
    );
}

/**
 * Helper function to run a function for each page of results.
 *
 * It will keep calling the function until all pages are processed.
 * The function should return an object with the result to accumulate and a pager object.
 * The function will return teh accumulated array of results.
 */

async function runForPage<Res>(fn: (page: number) => Promise<{ result: Res; pager: Pager }>): Promise<Res[]> {
    const results: Res[] = [];
    let page = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { result, pager } = await fn(page);
        results.push(result);
        page++;
        if (page > pager.pageCount) break;
    }

    return results;
}
