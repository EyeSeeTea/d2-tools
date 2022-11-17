//

import { getBaseConfigForField } from "./configBase";

const getBaseProps = ({ compulsory, disabled, unique }) => ({
    metaCompulsory: compulsory,
    metaDisabled: disabled || unique?.generatable,
});

export const createProps = (props, metaData) => ({
    ...getBaseProps(metaData),
    ...props,
});

// $FlowFixMe[prop-missing] automated comment
// $FlowFixMe[incompatible-return] automated comment
export const createFieldConfig = (fieldSpecifications, metaData) => ({
    ...getBaseConfigForField(metaData),
    ...fieldSpecifications,
});
