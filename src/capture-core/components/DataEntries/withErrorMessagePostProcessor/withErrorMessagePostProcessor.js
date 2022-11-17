//
import * as React from "react";

import { UniqueTEADuplicate } from "./UniqueTEADuplicate/UniqueTEADuplicate.component";

export const withErrorMessagePostProcessor = getTrackedEntityTypeName => InnerComponent =>
    class ErrorMessagePostProcessorHOC extends React.Component {
        constructor(props) {
            super(props);
            this.cache = {};
        }

        postProcessErrorMessage = ({ errorMessage, errorType, errorData, id, fieldLabel }) => {
            if (errorType !== "unique") {
                return errorMessage;
            }

            const cacheItem = this.cache[id] || {};
            if (errorMessage === cacheItem.errorMessage && errorData === cacheItem.errorData) {
                return cacheItem.outputElement;
            }

            const outputElement = (
                <UniqueTEADuplicate
                    errorData={errorData}
                    ExistingUniqueValueDialogActions={this.props.ExistingUniqueValueDialogActions}
                    trackedEntityTypeName={getTrackedEntityTypeName(this.props)}
                    attributeName={fieldLabel}
                />
            );

            this.cache[id] = {
                errorMessage,
                errorData,
                outputElement,
            };

            return outputElement;
        };

        render() {
            const { ExistingUniqueValueDialogActions, ...passOnProps } = this.props;

            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent onPostProcessErrorMessage={this.postProcessErrorMessage} {...passOnProps} />
            );
        }
    };
