//
import { Icon } from "../../../../metaData";

export const buildIcon = cachedStyle => {
    const { color, icon: name } = cachedStyle || {};

    if (!color && !name) {
        return undefined;
    }

    return new Icon(_icon => {
        _icon.color = color || undefined;
        _icon.name = name || undefined;
    });
};
