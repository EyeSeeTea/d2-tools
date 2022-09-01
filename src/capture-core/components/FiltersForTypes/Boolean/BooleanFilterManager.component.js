//
import * as React from "react";
import { BooleanFilter } from "./BooleanFilter.component";

export class BooleanFilterManager extends React.Component {
    static calculateDefaultValueState(filter) {
        if (!filter) {
            return undefined;
        }

        return filter.values.map(value => (value ? "true" : "false"));
    }

    constructor(props) {
        super(props);
        this.state = {
            value: BooleanFilterManager.calculateDefaultValueState(this.props.filter),
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
            <BooleanFilter
                value={this.state.value}
                innerRef={filterTypeRef}
                onCommitValue={this.handleCommitValue}
                {...passOnProps}
            />
        );
    }
}
