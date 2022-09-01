//

export function camelCaseUppercaseString(text) {
    const lowerCased = text.toLowerCase();
    const camelCased = lowerCased.replace(/_(.)/g, (_, character) => character.toUpperCase());
    return camelCased;
}
