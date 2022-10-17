//
import * as React from "react";
import { OptionSetFilter } from "./OptionSetFilter.component";

export class OptionSetFilterManager extends React.Component {
    static calculateDefaultValueState(filter, singleSelect) {
        if (!filter) {
            return undefined;
        }

        return singleSelect ? filter.values[0] : filter.values;
    }

    constructor(props) {
        super(props);
        this.state = {
            value: OptionSetFilterManager.calculateDefaultValueState(
                this.props.filter,
                !!this.props.singleSelect
            ),
        };
    }

    handleCommitValue = value => {
        this.setState({
            value,
        });
        this.props.handleCommitValue && this.props.handleCommitValue();
    };

    render() {
        const { filter, filterTypeRef, ...passOnProps } = this.props;

        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <OptionSetFilter
                value={this.state.value}
                innerRef={filterTypeRef}
                onCommitValue={this.handleCommitValue}
                {...passOnProps}
            />
        );
    }
}
