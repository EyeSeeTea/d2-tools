//

export function capitalizeFirstLetterInWords(text) {
    return text
        .split(" ")
        .map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1))
        .reduce((accCapitalizedText, capitalizedWord) => `${accCapitalizedText} ${capitalizedWord}`, "");
}
