//
import * as React from "react";

import { UniqueTEADuplicateErrorMessageCreator } from "./ErrorMessageCreator.component";
import { ExistingTEIDialog } from "./ExistingTEIDialog.component";

export class UniqueTEADuplicate extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            existingTeiDialogOpen: false,
        };
    }

    openDialog = () => {
        this.setState({
            existingTeiDialogOpen: true,
        });
    };

    closeDialog = () => {
        this.setState({
            existingTeiDialogOpen: false,
        });
    };

    render() {
        const { attributeName, trackedEntityTypeName, ...passOnProps } = this.props;
        const { existingTeiDialogOpen } = this.state;

        return (
            <React.Fragment>
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <UniqueTEADuplicateErrorMessageCreator
                    onShowExisting={this.openDialog}
                    trackedEntityTypeName={trackedEntityTypeName}
                    attributeName={attributeName}
                    {...passOnProps}
                />
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <ExistingTEIDialog
                    open={existingTeiDialogOpen}
                    onCancel={this.closeDialog}
                    {...passOnProps}
                />
            </React.Fragment>
        );
    }
}
