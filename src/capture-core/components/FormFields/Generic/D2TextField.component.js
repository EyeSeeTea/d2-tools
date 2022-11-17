//
import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";

export class D2TextField extends Component {
    static defaultProps = {
        value: "",
    };

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    handleChange = event => {
        this.props.onChange && this.props.onChange(event.currentTarget.value, event);
    };

    handleBlur = event => {
        this.props.onBlur && this.props.onBlur(event.currentTarget.value, event);
    };

    focus() {
        this.materialUIInstance && this.materialUIInstance.focus();
    }

    render() {
        const { onChange, onBlur, value, ...passOnProps } = this.props;

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
                    value={value || ""}
                    onChange={this.handleChange}
                    onBlur={this.handleBlur}
                    {...passOnProps}
                />
            </div>
        );
    }
}
