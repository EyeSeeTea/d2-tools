//
import React from "react";
import classNames from "classnames";

export const withCustomElementContainer =
    onGetContainerClass =>
    // $FlowFixMe[prop-missing] automated comment
    InnerComponent =>
        class CustomElementContainerHOC extends React.Component {
            constructor(props) {
                super(props);
                this.defaultClass = onGetContainerClass && onGetContainerClass(this.props);
            }

            render() {
                const { customFormElementProps, ...passOnProps } = this.props;
                const containerClass = classNames(customFormElementProps.className, this.defaultClass);

                return (
                    <div {...customFormElementProps} className={containerClass}>
                        <InnerComponent {...passOnProps} />
                    </div>
                );
            }
        };
