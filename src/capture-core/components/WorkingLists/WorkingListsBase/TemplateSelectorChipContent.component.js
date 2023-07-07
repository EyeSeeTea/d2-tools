//

export const TemplateSelectorChipContent = props => {
    const { currentListIsModified, text, isSelectedTemplate } = props;

    const truncatedText = text.length > 30 ? `${text.substring(0, 27)}...` : text;
    const content = isSelectedTemplate && currentListIsModified ? `${truncatedText} *` : truncatedText;

    return content;
};
