//
import * as React from "react";
import "./rowsPerPage.css";

import { OptionsSelectVirtualized } from "../FormFields/Options/SelectVirtualizedV2/OptionsSelectVirtualized.component";
import { withTranslations } from "../FormFields/Options/SelectVirtualized/withTranslations";

const OptionsSelectWithTranslations = withTranslations()(OptionsSelectVirtualized);

const getRowsPerPageSelector = InnerComponent =>
    class RowsPerPageSelector extends React.Component {
        static getOptions() {
            const options = [10, 15, 25, 50, 100].map(optionCount => ({
                label: optionCount.toString(),
                value: optionCount,
            }));
            return options;
        }

        constructor(props) {
            super(props);
            this.options = RowsPerPageSelector.getOptions();
        }

        handleRowsSelect = rowsPerPage => {
            this.props.onChangeRowsPerPage(rowsPerPage);
        };

        renderSelectorElement = () => {
            const rowsPerPage = this.props.rowsPerPage;

            return (
                <div id="rows-per-page-selector" data-test="rows-per-page-selector">
                    <OptionsSelectWithTranslations
                        onSelect={this.handleRowsSelect}
                        options={this.options}
                        value={rowsPerPage}
                        nullable={false}
                        withoutUnderline
                        searchable={false}
                    />
                </div>
            );
        };

        render = () => {
            const { ...passOnProps } = this.props;
            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent rowsCountSelector={this.renderSelectorElement()} {...passOnProps} />
            );
        };
    };

/**
 * Add rows per page selector to the inner component
 * @returns React Component
 * @alias withRowsPerPageSelector
 * @memberof Pagination
 * @example withRowsPerPageSelector()([InnerComponent])
 */
export const withRowsPerPageSelector = () => InnerComponent => getRowsPerPageSelector(InnerComponent);
