//
import * as React from "react";
import { D2CustomForm } from "./D2CustomForm.component";

export const withCustomForm = () => InnerComponent =>
    class CustomFormHOC extends React.Component {
        render() {
            const { customForm: customFormSpecs, ...passOnProps } = this.props;
            return (
                <InnerComponent {...passOnProps}>
                    {customFormSpecs
                        ? (onRenderField, fields) => (
                              <D2CustomForm
                                  onRenderField={onRenderField}
                                  fields={fields}
                                  specs={customFormSpecs}
                              />
                          )
                        : null}
                </InnerComponent>
            );
        }
    };
