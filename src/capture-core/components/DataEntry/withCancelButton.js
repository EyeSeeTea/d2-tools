//
import * as React from "react";
import { CancelButton } from "./CancelButton.container";

const getCancelButton = (InnerComponent, optionsFn) =>
    class CancelButtonHOC extends React.Component {
        getWrappedInstance = () => this.innerInstance;

        render() {
            const { onCancel, cancelButtonRef, ...passOnProps } = this.props;
            const options = (optionsFn && optionsFn(this.props)) || {};

            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent
                    innerRef={innerInstance => {
                        this.innerInstance = innerInstance;
                    }}
                    cancelButton={<CancelButton id={this.props.id} onCancel={onCancel} options={options} />}
                    {...passOnProps}
                />
            );
        }
    };

export const withCancelButton = optionsFn => InnerComponent => getCancelButton(InnerComponent, optionsFn);
