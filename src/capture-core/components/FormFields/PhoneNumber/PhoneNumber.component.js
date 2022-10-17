//
import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";

export class D2PhoneNumber extends Component {
    static defaultProps = {
        value: "",
    };

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    handleChange(event) {
        this.props.onChange(event.target.value, event);
    }

    handleBlur(event) {
        this.props.onBlur(event.target.value, event);
    }

    render() {
        const { onChange, onBlur, ...passOnProps } = this.props;

        return (
            <div
                ref={containerInstance => {
                    this.materialUIContainerInstance = containerInstance;
                }}
            >
                {/* $FlowFixMe[cannot-spread-inexact] automated comment */}
                <TextField
                    inputRef={inst => {
                        this.materialUIInstance = inst;
                    }}
                    {...passOnProps}
                    type="text"
                    onChange={this.handleChange}
                    onBlur={this.handleBlur}
                />
            </div>
        );
    }
}
