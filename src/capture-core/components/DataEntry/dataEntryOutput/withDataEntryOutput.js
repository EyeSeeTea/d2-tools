//

import * as React from "react";

const getDataEntryOutput = (InnerComponent, Output) =>
    class DataEntryOutputBuilder extends React.Component {
        constructor(props) {
            super(props);
            this.name = "DataEntryOutputBuilder";
        }

        getDataEntryOutputs = () => {
            const dataEntryOutputs = this.props.dataEntryOutputs;
            const output = this.getOutput(dataEntryOutputs ? dataEntryOutputs.length : 0);
            return dataEntryOutputs ? [...dataEntryOutputs, output] : [output];
        };
        getOutput = key => (
            <div style={{ marginTop: 10 }} key={key}>
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <Output key={key} {...this.props} />
            </div>
        );

        render = () => {
            const { dataEntryOutputs, ...passOnProps } = this.props;

            return (
                <div>
                    {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                    <InnerComponent
                        ref={innerInstance => {
                            this.innerInstance = innerInstance;
                        }}
                        dataEntryOutputs={this.getDataEntryOutputs()}
                        {...passOnProps}
                    />
                </div>
            );
        };
    };

export const withDataEntryOutput = () => (InnerComponent, Output) =>
    getDataEntryOutput(InnerComponent, Output);
