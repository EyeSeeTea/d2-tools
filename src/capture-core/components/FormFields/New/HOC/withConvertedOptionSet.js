//
import * as React from "react";
import log from "loglevel";
import { errorCreator } from "capture-core-utils";
import {} from "../../../../metaData";
import { convertValue } from "../../../../converters/clientToForm";

export const withConvertedOptionSet = () => InnerComponent =>
    class OptionSetConverter extends React.Component {
        constructor(props) {
            super(props);
            // $FlowFixMe[incompatible-type] automated comment
            this.formOptionSet = this.buildFormOptionSet();
        }
        static errorMessages = {
            DATAELEMENT_MISSING: "DataElement missing",
        };

        buildFormOptionSet() {
            const optionSet = this.props.optionSet;
            if (!optionSet.dataElement) {
                log.error(
                    errorCreator(OptionSetConverter.errorMessages.DATAELEMENT_MISSING)({
                        OptionSetConverter: this,
                    })
                );
                return null;
            }
            return optionSet.dataElement.getConvertedOptionSet(convertValue);
        }

        render() {
            return <InnerComponent {...this.props} optionSet={this.formOptionSet} />;
        }
    };
