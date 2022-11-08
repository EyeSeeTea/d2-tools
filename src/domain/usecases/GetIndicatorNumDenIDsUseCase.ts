import _ from "lodash";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { IndicatorsRepository, indicatorDataRow } from "domain/repositories/IndicatorsRepository";
import { Ref } from "@eyeseetea/d2-api";

export class GetIndicatorNumDenIDsUseCase {
    constructor(
        private indicatorsRepository: IndicatorsRepository,
        private dataSetsRepository: DataSetsRepository
    ) {}

    private async processIndicatorsItem(indicatorsItem: string) {
        const dataElements = processDEParams(indicatorsItem);
        const programDataElements = processPDEParams(indicatorsItem);
        const categoryOptionCombos = processCOCombosParams(indicatorsItem);
        const indicators = processPIndicatorsParams(indicatorsItem);

        const cocDataElements = _.uniq(categoryOptionCombos.map(item => item.dataElement));
        const dataElementsList = [...dataElements, ...cocDataElements];

        const dataSets = await this.dataSetsRepository.getDataSetByElementId(dataElementsList);

        return {
            dataElementsList: dataElementsList,
            categoryOptionCombos: categoryOptionCombos,
            programDataElementsList: _.uniq(programDataElements.map(item => item.dataElement)),
            coCombosList: _.uniq(categoryOptionCombos.map(item => item.coCombo)),
            pIndicatorsList: indicators,
            dataSetsList: processDataSets(dataSets),
            programList: _.uniq(programDataElements.map(item => item.program)),
        };
    }

    async execute(options: { indicatorsIDs: string[] }): Promise<indicatorDataRow[]> {
        const { indicatorsIDs } = options;

        const indicatorsMetadata = await this.indicatorsRepository.get(indicatorsIDs);

        const indicatorsData = await Promise.all(
            indicatorsMetadata.map(async indicatorsItem => {
                const numerator = await this.processIndicatorsItem(indicatorsItem.numerator);
                const denominator = await this.processIndicatorsItem(indicatorsItem.denominator);

                return {
                    id: indicatorsItem.id,
                    indName: indicatorsItem.name,
                    numerator: trimLineBreaks(indicatorsItem.numerator),
                    numDataElementsList: numerator.dataElementsList,
                    numProgramDataElementsList: numerator.programDataElementsList,
                    numCOCombosList: numerator.coCombosList,
                    numPIndicatorsList: numerator.pIndicatorsList,
                    numDataSetsList: numerator.dataSetsList,
                    numProgramList: numerator.programList,
                    denominator: trimLineBreaks(indicatorsItem.denominator),
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
        .flatMap(item => {
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
        return program && dataElement ? { dataElement: dataElement, program: program } : [];
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

const dataSetsList = [
    "tnek2LjfuIm",
    "zna8KfLMXn4",
    "fdBM4sWSuPR",
    "SHw2zOysJ1R",
    "Uc3j0vpsfSB",
    "Sn0dExPzQqW",
    "NKWbkXyfO5F",
    "p0NhuIUoeST",
    "deKCGAGoEHz",
];

function processDataSets(dataSets: Ref[]) {
    return _(dataSets)
        .flatMap(dataSet => (dataSetsList.includes(dataSet.id) ? dataSet.id : []))
        .compact()
        .uniq()
        .value();
}
