//
import { optionSetStore } from "../../metaDataMemoryStores/optionSets/optionSets.store";

export function buildOptionSets(cachedOptionSets) {
    optionSetStore.set(cachedOptionSets);
}
