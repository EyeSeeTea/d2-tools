//
import { useMemo, useState, useEffect } from "react";
import { useDataQuery } from "@dhis2/app-runtime";

export const useTrackedEntityInstances = (teiId, programId, storedAttributeValues) => {
    const [trackedEntityInstanceAttributes, setTrackedEntityInstanceAttributes] = useState([]);

    const { error, loading, data } = useDataQuery(
        useMemo(
            () => ({
                trackedEntityInstance: {
                    resource: "tracker/trackedEntities",
                    id: teiId,
                    params: {
                        program: programId,
                    },
                },
            }),
            [teiId, programId]
        )
    );

    const {
        loading: tetLoading,
        data: tetData,
        refetch: refetchTET,
    } = useDataQuery(
        useMemo(
            () => ({
                trackedEntityType: {
                    resource: "trackedEntityTypes",
                    id: ({ variables: { tetId } }) => tetId,
                    params: {
                        fields: "displayName",
                    },
                },
            }),
            []
        ),
        { lazy: true }
    );

    useEffect(() => {
        if (data?.trackedEntityInstance?.attributes?.length > 0) {
            setTrackedEntityInstanceAttributes(
                data?.trackedEntityInstance?.attributes.map(({ attribute, value }) => ({
                    attribute,
                    value,
                }))
            );
        }
    }, [data?.trackedEntityInstance?.attributes]);

    useEffect(() => {
        if (storedAttributeValues?.length > 0) {
            setTrackedEntityInstanceAttributes(storedAttributeValues);
        }
    }, [storedAttributeValues]);

    useEffect(() => {
        if (data?.trackedEntityInstance?.trackedEntityType) {
            refetchTET({ variables: { tetId: data?.trackedEntityInstance?.trackedEntityType } });
        }
    }, [data?.trackedEntityInstance?.trackedEntityType, refetchTET]);

    return {
        error,
        loading,
        trackedEntityInstanceAttributes: !loading && trackedEntityInstanceAttributes,
        trackedEntityTypeName: !tetLoading && tetData?.trackedEntityType?.displayName,
    };
};
