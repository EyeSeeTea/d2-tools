import _ from "lodash";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { IndicatorsRepository } from "domain/repositories/IndicatorsRepository";
import { indicatorDataReportRow } from "domain/entities/IndicatorsReports";
import { Ref } from "@eyeseetea/d2-api";

export class GetIndicatorNumDenIDsUseCase {
    constructor(
        private indicatorsRepository: IndicatorsRepository,
        private dataSetsRepository: DataSetsRepository
    ) {}

    private async processIndicatorsItem(indicatorsItem: string, dataSetFilterList?: string[]) {
        const dataElements = processDEParams(indicatorsItem);
        const programDataElements = processPDEParams(indicatorsItem);
        const categoryOptionCombos = processCOCombosParams(indicatorsItem);
        const indicators = processPIndicatorsParams(indicatorsItem);

        const cocDataElements = _.uniq(categoryOptionCombos.map(item => item.dataElement));
        const dataElementsList = [...dataElements, ...cocDataElements];

        const dataSets = await this.dataSetsRepository.getByDataElements(dataElementsList);

        return {
            dataElementsList: dataElementsList,
            categoryOptionCombos: categoryOptionCombos,
            programDataElementsList: _.uniq(programDataElements.map(item => item.dataElement)),
            coCombosList: _.uniq(categoryOptionCombos.map(item => item.coCombo)),
            pIndicatorsList: indicators,
            dataSetsList: processDataSets(dataSets, dataSetFilterList),
            programList: _.uniq(programDataElements.map(item => item.program)),
        };
    }

    async execute(options: {
        indicatorsIDs: string[];
        dataSetFilterList?: string[];
    }): Promise<indicatorDataReportRow[]> {
        const { indicatorsIDs, dataSetFilterList } = options;

        const indicatorsMetadata = await this.indicatorsRepository.get(indicatorsIDs);

        const indicatorsData = await Promise.all(
            indicatorsMetadata.map(async (indicatorsItem): Promise<indicatorDataReportRow> => {
                const numerator = await this.processIndicatorsItem(
                    indicatorsItem.numerator,
                    dataSetFilterList
                );
                const denominator = await this.processIndicatorsItem(
                    indicatorsItem.denominator,
                    dataSetFilterList
                );

                return {
                    id: indicatorsItem.id,
                    indName: indicatorsItem.name,
                    numerator: trimLineBreaks(indicatorsItem.numerator),
                    numDescription: indicatorsItem.numeratorDescription,
                    numDataElementsList: numerator.dataElementsList,
                    numProgramDataElementsList: numerator.programDataElementsList,
                    numCOCombosList: numerator.coCombosList,
                    numPIndicatorsList: numerator.pIndicatorsList,
                    numDataSetsList: numerator.dataSetsList,
                    numProgramList: numerator.programList,
                    denominator: trimLineBreaks(indicatorsItem.denominator),
                    denDescription: indicatorsItem.denominatorDescription,
                    denDataElementsList: denominator.dataElementsList,
                    denProgramDataElementsList: denominator.programDataElementsList,
                    denCOCombosList: denominator.coCombosList,
                    denPIndicatorsList: denominator.pIndicatorsList,
                    denDataSetsList: denominator.dataSetsList,
                    denProgramList: denominator.programList,
                };
            })
        );

        return indicatorsData;
    }
}

function trimLineBreaks(string: string) {
    return string.replace(/\n|\r/g, "");
}

function trimItemSeparators(string: string, type: string) {
    return string.replace(`${type}{`, "").replace("}", "");
}

function processDEParams(exp: string) {
    const dataElems = _.uniq(exp.match(/(?:#\{.{11}\})/g)) ?? [];

    return _(dataElems)
        .map(item => {
            const dataElement = trimItemSeparators(item, "#");
            return dataElement;
        })
        .uniq()
        .value();
}

function processPDEParams(exp: string) {
    const progDEs = exp.match(/(?:D\{.{11}\..{11}\})/g) ?? [];

    return progDEs.flatMap(item => {
        const cleanItem = trimItemSeparators(item, "D");
        const [program, dataElement] = cleanItem.split(".");
        return program && dataElement ? [{ dataElement: dataElement, program: program }] : [];
    });
}

function processCOCombosParams(exp: string) {
    const coCombos = exp.match(/(?:#\{.{11}\..{11}\})/g) ?? [];

    return coCombos.flatMap(item => {
        const cleanItem = trimItemSeparators(item, "#");
        const [dataElement, coCombo] = cleanItem.split(".");
        return dataElement && coCombo ? { dataElement: dataElement, coCombo: coCombo } : [];
    });
}

function processPIndicatorsParams(exp: string) {
    const indicators = exp.match(/(?:I\{.{11}\})/g) ?? [];

    return _(indicators)
        .flatMap(item => {
            const dataElement = trimItemSeparators(item, "I");
            return dataElement;
        })
        .uniq()
        .value();
}

function processDataSets(dataSets: Ref[], dataSetFilterList?: string[]) {
    return _(dataSets)
        .map(dataSet => {
            let id: string | undefined = undefined;

            if ((dataSetFilterList && dataSetFilterList.includes(dataSet.id)) || !dataSetFilterList) {
                id = dataSet.id;
            }

            return id;
        })
        .compact()
        .uniq()
        .value();
}
