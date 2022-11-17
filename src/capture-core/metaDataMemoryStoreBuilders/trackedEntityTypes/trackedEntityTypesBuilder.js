//
import { trackedEntityTypesCollection } from "../../metaDataMemoryStores";
import { TrackedEntityTypeFactory } from "./factory";

export async function buildTrackedEntityTypes({
    cachedTrackedEntityTypes,
    cachedTrackedEntityAttributes,
    cachedOptionSets,
    locale,
}) {
    const trackedEntityTypeFactory = new TrackedEntityTypeFactory(
        cachedTrackedEntityAttributes,
        cachedOptionSets,
        locale
    );

    // $FlowFixMe
    await [...cachedTrackedEntityTypes.values()].asyncForEach(async cachedType => {
        const trackedEntityType = await trackedEntityTypeFactory.build(cachedType);
        trackedEntityTypesCollection.set(trackedEntityType.id, trackedEntityType);
    });

    return trackedEntityTypesCollection;
}
