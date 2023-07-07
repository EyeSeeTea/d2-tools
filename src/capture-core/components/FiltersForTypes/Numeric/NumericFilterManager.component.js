//
import * as React from "react";
import { NumericFilter } from "./NumericFilter.component";

export class NumericFilterManager extends React.Component {
    // eslint-disable-next-line complexity
    static calculateDefaultState(filter) {
        return {
            min: filter && (filter.ge || filter.ge === 0) ? filter.ge.toString() : undefined,
            max: filter && (filter.le || filter.le === 0) ? filter.le.toString() : undefined,
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            value: NumericFilterManager.calculateDefaultState(this.props.filter),
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
            <NumericFilter
                value={this.state.value}
                innerRef={filterTypeRef}
                onCommitValue={this.handleCommitValue}
                {...passOnProps}
            />
        );
    }
}
