import _ from "lodash";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { IndicatorsRepository } from "domain/repositories/IndicatorsRepository";
import { DataSetId } from "domain/entities/DataSet";
import { indicatorDataRow } from "domain/entities/Indicator";

export class GetIndicatorNumDenIDsUseCase {
    constructor(
        private indicatorsRepository: IndicatorsRepository,
        private dataSetsRepository: DataSetsRepository
    ) {}

    private async processIndicatorsItem(indicatorsItem: string) {
        const dataElementsIDs = processDEParams(indicatorsItem);
        const programDataElements = processPDEParams(indicatorsItem);
        const categoryOptionCombos = processCCOptionsParams(indicatorsItem);
        const indicators = processPIndicatorsParams(indicatorsItem);

        const dataSets = await this.dataSetsRepository.getDataSetByElementId(dataElementsIDs);

        return {
            dataElementsList: [...dataElementsIDs, ...categoryOptionCombos.map(item => item.dataElement)],
            programDataElementsList: programDataElements.map(item => item.dataElement),
            coCombosList: categoryOptionCombos.map(item => item.ccOption),
            pIndicatorsList: indicators,
            dataSetsList: processDataSets(dataSets),
            programList: programDataElements.map(item => item.program),
        };
    }

    async execute(options: { indicatorsIDs: string[] }): Promise<indicatorDataRow[]> {
        const { indicatorsIDs } = options;

        // log.info(`Replace the destination OU: ${replace}`);

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

function processDEParams(exp: string) {
    const dataElems = exp.match(/(?:#\{.{11}\})/g) ?? [];

    return dataElems.flatMap(item => {
        const dataElement = item.replace("#{", "").replace("}", "");
        return dataElement;
    });
}

function processPDEParams(exp: string) {
    const progDEs = exp.match(/(?:D\{.{11}\..{11}\})/g) ?? [];

    return progDEs.flatMap(item => {
        const cleanItem = item.replace("D{", "").replace("}", "");
        const [program, dataElement] = cleanItem.split(".");
        return program && dataElement ? { dataElement: dataElement, program: program } : [];
    });
}

function processCCOptionsParams(exp: string) {
    const ccOptions = exp.match(/(?:#\{.{11}\..{11}\})/g) ?? [];

    return ccOptions.flatMap(item => {
        const cleanItem = item.replace("#{", "").replace("}", "");
        const [dataElement, ccOption] = cleanItem.split(".");
        return dataElement && ccOption ? { dataElement: dataElement, ccOption: ccOption } : [];
    });
}

function processPIndicatorsParams(exp: string) {
    const indicators = exp.match(/(?:I\{.{11}\})/g) ?? [];

    return indicators.flatMap(item => {
        const dataElement = item.replace("I{", "").replace("}", "");
        return dataElement;
    });
}

function processDataSets(dataSets: DataSetId[]) {
    return _(dataSets)
        .flatMap(dataSet => dataSet.id)
        .compact()
        .value();
}
