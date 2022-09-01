//
// Temporary container for org unit tree roots
const rootsContainer = {};

export function set(id, roots) {
    rootsContainer[id] = roots;
}

export function get(id) {
    return rootsContainer[id];
}
