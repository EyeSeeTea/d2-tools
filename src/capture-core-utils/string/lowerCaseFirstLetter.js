//
export function lowerCaseFirstLetter(text) {
    const first = text.charAt(0).toLocaleLowerCase();
    const rest = text.slice(1);
    return first + rest;
}
