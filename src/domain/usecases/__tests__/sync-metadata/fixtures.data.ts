import { MetadataModel, MetadataObject } from "domain/entities/MetadataObject";

export function buildMetadataObject(model: MetadataModel, data?: Partial<MetadataObject>): MetadataObject {
    return {
        id: "id",
        name: "name",
        code: "code",
        model,
        ...data,
    };
}

const dataElementOneFakeData = buildMetadataObject("dataElements", {
    id: "de_id_1",
    name: "Data Element 1",
    code: "DE1",
});

const dataElementTwoFakeData = buildMetadataObject("dataElements", {
    id: "de_id_2",
    name: "Data Element 2",
    code: "DE2",
});

const indicatorOneFakeData = buildMetadataObject("indicators", {
    id: "ind_id_1",
    name: "Indicator 1",
    code: "IND1",
});

const indicatorTwoFakeData = buildMetadataObject("indicators", {
    id: "ind_id_2",
    name: "Indicator 2",
    code: "IND2",
});

export const metadataServerFakeData = [
    dataElementOneFakeData,
    dataElementTwoFakeData,
    indicatorOneFakeData,
    indicatorTwoFakeData,
];

export const replicaOneFakeData = [
    dataElementOneFakeData,
    dataElementTwoFakeData,
    indicatorOneFakeData,
    indicatorTwoFakeData,
    buildMetadataObject("indicators", {
        id: "ind_id_exclusive",
        name: "Indicator exclusive",
        code: "IND_EXCLUSIVE_2",
    }),
];

export const replicaTwoFakeData = [
    buildMetadataObject("dataElements", { id: "de_id_3", name: "Data Element 3", code: "DE3" }),
    dataElementTwoFakeData,
    buildMetadataObject("indicators", { id: "ind_id_3", name: "Indicator 3", code: "IND3" }),
    indicatorTwoFakeData,
];

export const mainDataWithCodeDiscrepancies = [
    buildMetadataObject("dataSets", { id: "ds_id_1", name: "DataSet 1", code: "DS_1" }),
    buildMetadataObject("dataSets", { id: "ds_id_2", name: "DataSet 2", code: "DS_2" }),
    buildMetadataObject("dataSets", { id: "ds_id_3", name: "DataSet 3", code: "DS_3" }),
    buildMetadataObject("categories", { id: "cat_id_1", name: "Category 1", code: "cat_1" }),
    buildMetadataObject("categories", { id: "cat_id_2", name: "Category 2", code: "cat_2" }),
];

export const replicaDataWithCodeDiscrepancies = [
    buildMetadataObject("dataSets", { id: "ds_id_1", name: "DataSet 1", code: undefined }),
    buildMetadataObject("dataSets", { id: "ds_id_2", name: "DataSet 2", code: "DS_2" }),
    buildMetadataObject("dataSets", { id: "ds_id_3", name: "DataSet 3", code: "DS_THREE_OTHER_CODE" }),
    buildMetadataObject("categories", { id: "cat_id_1", name: "Category 1", code: "cat_replica_1" }),
];

export const replicaTwoDataWithCodeDiscrepancies = [
    buildMetadataObject("dataSets", { id: "ds_id_2", name: "DataSet 2", code: "DS_TWO_REPLICA_TWO" }),
];

export const mainDataWithPropertiesDiscrepancies = [
    buildMetadataObject("indicators", {
        id: "ind_p_1",
        name: "Indicator 1",
        code: "IP_1",
        additionalFields: { dataSets: ["ds_id1"], numerator: "de1+de2" },
    }),
    buildMetadataObject("indicators", {
        id: "ind_p_2",
        name: "Indicator 2",
        code: "IP_2",
        additionalFields: { dataSets: ["ds_id_2", "ds_id_4"], numerator: "de4+de6" },
    }),
    buildMetadataObject("indicators", {
        id: "ind_p_3",
        name: "Indicator 3",
        code: "IP_3",
        additionalFields: { name: "Indicator 3", dataSets: [], numerator: "" },
    }),
];

export const replicaOneDataWithPropertiesDiscrepancies = [
    buildMetadataObject("indicators", {
        id: "ind_p_1",
        name: "Indicator 1",
        code: "IP_1",
        additionalFields: { dataSets: ["ds_id1"], numerator: "de1+de2" },
    }),
    buildMetadataObject("indicators", {
        id: "ind_p_2",
        name: "Indicator 2 Replica One",
        code: "IP_2",
        additionalFields: { name: "Indicator 2 Replica One", dataSets: ["ds_id_4"], numerator: "de15+de20" },
    }),
    buildMetadataObject("indicators", {
        id: "ind_p_3",
        name: "Indicator 3",
        code: "IP_3",
        additionalFields: { name: "Indicator 3", dataSets: [], numerator: "" },
    }),
];
