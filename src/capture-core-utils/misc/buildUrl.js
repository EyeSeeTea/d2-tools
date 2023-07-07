//

export const buildUrl = (...urlParts) => urlParts.map(part => part.replace(/(^\/)|(\/$)/, "")).join("/");
