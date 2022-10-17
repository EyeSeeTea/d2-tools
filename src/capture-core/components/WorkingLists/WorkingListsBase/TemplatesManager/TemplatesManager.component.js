//
import React, { useContext } from "react";
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import { ListViewConfig } from "../ListViewConfig";
import { TemplateSelector } from "../TemplateSelector.component";
import { ManagerContext } from "../workingListsBase.context";
import { withBorder } from "../borderHOC";

const TemplatesManagerPlain = props => {
    const { templates, ...passOnProps } = props;

    const { currentTemplate, onSelectTemplate } = useContext(ManagerContext) || {};

    if (!templates || !currentTemplate) {
        log.error(
            errorCreator("Templates and currentTemplate needs to be set during templates loading")({
                templates,
                currentTemplate,
            })
        );
        throw Error(
            "Templates and currentTemplate needs to be set during templates loading. See console for details"
        );
    }

    const handleSelectTemplate = React.useCallback(
        template => {
            if (template.id === currentTemplate.id) {
                const defaultTemplate = templates.find(t => t.isDefault);
                // $FlowFixMe
                onSelectTemplate(defaultTemplate.id);
                return;
            }
            onSelectTemplate(template.id);
        },
        [onSelectTemplate, currentTemplate.id, templates]
    );

    return (
        <ListViewConfig {...passOnProps} currentTemplate={currentTemplate}>
            {currentListIsModified => (
                <TemplateSelector
                    templates={templates}
                    currentTemplateId={currentTemplate.id}
                    currentListIsModified={currentListIsModified}
                    onSelectTemplate={handleSelectTemplate}
                />
            )}
        </ListViewConfig>
    );
};

export const TemplatesManager = withBorder()(TemplatesManagerPlain);
