//
export function capitalizeFirstLetter(text) {
    const first = text.charAt(0).toLocaleUpperCase();
    const rest = text.slice(1);
    return first + rest;
}
