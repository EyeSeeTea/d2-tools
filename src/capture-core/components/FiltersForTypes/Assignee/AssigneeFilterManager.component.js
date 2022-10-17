//
import * as React from "react";
import { AssigneeFilter } from "./AssigneeFilter.component";

export class AssigneeFilterManager extends React.Component {
    static calculateDefaultValueState(filter) {
        if (!filter) {
            return undefined;
        }

        return {
            mode: filter.assignedUserMode,
            provided: filter.assignedUser,
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            value: AssigneeFilterManager.calculateDefaultValueState(this.props.filter),
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
            <AssigneeFilter
                value={this.state.value}
                innerRef={filterTypeRef}
                onCommitValue={this.handleCommitValue}
                {...passOnProps}
            />
        );
    }
}
