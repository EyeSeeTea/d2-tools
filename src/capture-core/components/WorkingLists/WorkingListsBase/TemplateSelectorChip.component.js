//
import * as React from "react";
import { Chip } from "@dhis2/ui";
import { TemplateSelectorChipContent } from "./TemplateSelectorChipContent.component";

export const TemplateSelectorChip = props => {
    const { template, currentTemplateId, onSelectTemplate, ...passOnProps } = props;
    const { name, id } = template;

    const selectTemplateHandler = React.useCallback(() => {
        onSelectTemplate(template);
    }, [onSelectTemplate, template]);

    return (
        <Chip
            dataTest="workinglist-template-selector-chip"
            selected={id === currentTemplateId}
            onClick={selectTemplateHandler}
        >
            <TemplateSelectorChipContent
                {...passOnProps}
                text={name}
                isSelectedTemplate={id === currentTemplateId}
            />
        </Chip>
    );
};
