//

import { convertPx, getBaseConfigForField } from "./configBase";

const baseComponentStyles = {
    labelContainerStyle: {
        flexBasis: 200,
    },
    inputContainerStyle: {
        flexBasis: 150,
    },
};

const baseComponentStylesVertical = {
    labelContainerStyle: {
        width: 150,
    },
    inputContainerStyle: {
        width: 150,
    },
};

const getBaseProps = ({ formName, compulsory, disabled, unique, icon, description, url }) => ({
    description,
    url,
    styles: baseComponentStyles,
    label: formName,
    metaCompulsory: compulsory,
    metaDisabled: disabled || (unique && unique.generatable),
    icon: icon
        ? {
              name: icon.name,
              color: icon.color,
          }
        : null,
});

const getBaseFormHorizontalProps = options => ({
    style: {
        width: convertPx(options, 150),
    },
    styles: baseComponentStylesVertical,
});

export const createProps = (props, options, metaData) => ({
    ...getBaseProps(metaData),
    ...(options && options.formHorizontal ? getBaseFormHorizontalProps(options) : {}),
    ...props,
});

// $FlowFixMe[prop-missing] automated comment
// $FlowFixMe[incompatible-return] automated comment
export const createFieldConfig = (fieldSpecifications, metaData) => ({
    ...getBaseConfigForField(metaData),
    ...fieldSpecifications,
});
