//
import * as React from "react";
import { TrueOnlyFilter } from "./TrueOnlyFilter.component";

export class TrueOnlyFilterManager extends React.Component {
    static calculateDefaultState(filter) {
        return {
            value: filter && filter.value ? ["true"] : undefined,
        };
    }

    constructor(props) {
        super(props);
        this.state = TrueOnlyFilterManager.calculateDefaultState(this.props.filter);
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
            <TrueOnlyFilter
                value={this.state.value}
                innerRef={filterTypeRef}
                onCommitValue={this.handleCommitValue}
                {...passOnProps}
            />
        );
    }
}
