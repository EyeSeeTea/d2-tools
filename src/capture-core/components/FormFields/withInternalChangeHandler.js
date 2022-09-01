//
import * as React from "react";

export const withInternalChangeHandler = () => InnerComponent =>
    class DefaultFieldChangeHandler extends React.Component {
        constructor(props) {
            super(props);
            this.handleChange = this.handleChange.bind(this);
            const value = this.props.value;
            this.state = { value };
        }

        UNSAFE_componentWillReceiveProps(nextProps) {
            if (nextProps.value !== this.props.value) {
                this.setState({
                    value: nextProps.value,
                });
            }
        }

        handleChange(value) {
            this.setState({
                value,
            });
            this.props.onChange && this.props.onChange(value);
        }

        render() {
            const { onChange, value, ...passOnProps } = this.props;
            const stateValue = this.state.value;

            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent onChange={this.handleChange} value={stateValue} {...passOnProps} />
            );
        }
    };
