import _ from "lodash";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import {
    IndicatorsRepository,
    metadataItemName,
    valueReportRow,
} from "domain/repositories/IndicatorsRepository";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { DataValue } from "domain/entities/DataValue";
import { Ref } from "@eyeseetea/d2-api";

export class GetIndicatorsDataElementsValuesReportUseCase {
    constructor(
        private indicatorsRepository: IndicatorsRepository,
        private dataSetsRepository: DataSetsRepository,
        private dataValuesRepository: DataValuesRepository
    ) {}

    private async processIndicatorsItem(indicatorsItem: string) {
        const dataElements = processDEParams(indicatorsItem);
        const categoryOptionCombos = processCOCombosParams(indicatorsItem);

        const cocDataElements = _.uniq(categoryOptionCombos.map(item => item.dataElement));
        const dataElementsList = [...dataElements, ...cocDataElements];

        const dataSets = await this.dataSetsRepository.getDataSetByElementId(dataElementsList);

        return {
            dataElements: dataElements,
            categoryOptionCombos: categoryOptionCombos,
            dataSetsList: processDataSets(dataSets),
        };
    }

    async execute(options: {
        indicatorsIDs: string[];
        orgUnitsIDs: string[];
        period: string[];
    }): Promise<valueReportRow[]> {
        const { indicatorsIDs, orgUnitsIDs, period } = options;

        const indicatorsMetadata = await this.indicatorsRepository.get(indicatorsIDs);

        const dataElementCheckArray: deCheckType[] = await Promise.all(
            indicatorsMetadata.map(async indicatorsItem => {
                const numerator = await this.processIndicatorsItem(indicatorsItem.numerator);
                const denominator = await this.processIndicatorsItem(indicatorsItem.denominator);

                return {
                    dataSets: [...numerator.dataSetsList, ...denominator.dataSetsList],
                    dataElements: [...numerator.dataElements, ...denominator.dataElements],
                    categoryOptionCombos: [
                        ...numerator.categoryOptionCombos,
                        ...denominator.categoryOptionCombos,
                    ],
                };
            })
        );

        const deCheckObject = deCheckArrayToObject(dataElementCheckArray);

        const query = {
            dataSetIds: deCheckObject.dataSets,
            orgUnitIds: orgUnitsIDs,
            periods: period,
            includeDeleted: false,
        };
        const dataValues = await this.dataValuesRepository.get(query);

        const allDataElementsIds = [
            ...deCheckObject.dataElements,
            ..._.uniq(deCheckObject.categoryOptionCombos.map(item => item.dataElement)),
        ];
        const dataElementsNames = await this.indicatorsRepository.getDataElementsNames(allDataElementsIds);

        const allCOCombosIds = [..._.uniq(deCheckObject.categoryOptionCombos.map(item => item.coCombo))];
        const coCombosNames = await this.indicatorsRepository.getCOCombosNames(allCOCombosIds);

        const valuesReport = checkDataValues(dataValues, deCheckObject, dataElementsNames, coCombosNames);

        return valuesReport;
    }
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

function processCOCombosParams(exp: string) {
    const coCombos = exp.match(/(?:#\{.{11}\..{11}\})/g) ?? [];

    return coCombos.flatMap(item => {
        const cleanItem = trimItemSeparators(item, "#");
        const [dataElement, coCombo] = cleanItem.split(".");
        return dataElement && coCombo ? { dataElement: dataElement, coCombo: coCombo } : [];
    });
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

function deCheckArrayToObject(array: deCheckType[]): deCheckType {
    return _.mergeWith({}, ...array, (destValue: any, srcValue: any) =>
        _.uniq((destValue || []).concat(srcValue))
    );
}

function checkDataValues(
    dvArray: DataValue[],
    deCheckObject: deCheckType,
    dataElementsNames: metadataItemName[],
    coCombosNames: metadataItemName[]
): valueReportRow[] {
    const dataElements = deCheckObject.dataElements.flatMap(item => {
        const dataElementName =
            dataElementsNames.find(dnToFilter => {
                return dnToFilter.id === item;
            })?.name ?? "CANT_FIND";

        const dataValue = dvArray.find(dvToFilter => {
            return dvToFilter.dataElement === item;
        });

        return {
            dataElementId: item,
            dataElementName: dataElementName,
            value: dataValue ? dataValue.value : "NO_VALUE",
        };
    });

    const categoryOptionCombos = deCheckObject.categoryOptionCombos.flatMap(item => {
        const dataElementName =
            dataElementsNames.find(dnToFilter => {
                return dnToFilter.id === item.dataElement;
            })?.name ?? "CANT_FIND";

        const coComboName =
            coCombosNames.find(cocToFilter => {
                return cocToFilter.id === item.coCombo;
            })?.name ?? "CANT_FIND";

        const dataValue = dvArray.find(dvToFilter => {
            return (
                dvToFilter.dataElement === item.dataElement && dvToFilter.categoryOptionCombo === item.coCombo
            );
        });
        return {
            dataElementId: item.dataElement,
            dataElementName: dataElementName,
            coCombosId: item.coCombo,
            coComboName: coComboName,
            value: dataValue ? dataValue.value : "NO_VALUE",
        };
    });

    return [...dataElements, ...categoryOptionCombos];
}

type deCOComboType = {
    dataElement: string;
    coCombo: string;
};

type deCheckType = {
    dataSets: string[];
    dataElements: string[];
    categoryOptionCombos: deCOComboType[];
};
