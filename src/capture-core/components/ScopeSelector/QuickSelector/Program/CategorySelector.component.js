//
import * as React from "react";
import i18n from "@dhis2/d2-i18n";
import log from "loglevel";
import { errorCreator, makeCancelablePromise } from "capture-core-utils";

import { OptionsSelectVirtualized } from "../../../FormFields/Options/SelectVirtualizedV2/OptionsSelectVirtualized.component";
import { buildCategoryOptionsAsync } from "../../../../metaDataMemoryStoreBuilders";
import { withLoadingIndicator } from "../../../../HOC/withLoadingIndicator";
import { makeOnSelectSelector } from "./categorySelector.selectors";

const VirtualizedSelectLoadingIndicatorHOC = withLoadingIndicator(
    () => ({ marginTop: 5, paddingTop: 3, height: 0 }),
    () => ({ size: 22 }),
    props => props.options
)(OptionsSelectVirtualized);

export class CategorySelector extends React.Component {
    static getOptionsAsync(categoryId, selectedOrgUnitId, onIsAborted) {
        const predicate = categoryOption => {
            if (!selectedOrgUnitId) {
                return true;
            }

            const orgUnits = categoryOption.organisationUnits;
            if (!orgUnits) {
                return true;
            }

            return !!orgUnits[selectedOrgUnitId];
        };

        const project = categoryOption => ({
            label: categoryOption.displayName,
            value: categoryOption.id,
            writeAccess: categoryOption.access.data.write,
        });

        return buildCategoryOptionsAsync(categoryId, { predicate, project, onIsAborted });
    }

    static getDerivedStateFromProps(props, state) {
        if (props.selectedOrgUnitId !== state.prevOrgUnitId) {
            return {
                prevOrgUnitId: props.selectedOrgUnitId,
                options: null,
            };
        }
        return null;
    }

    constructor(props) {
        super(props);
        this.state = {
            options: null,
            prevOrgUnitId: null,
        };
        this.onSelectSelector = makeOnSelectSelector();
        // todo you cannot setState from this component (lgtm report)
        this.loadCagoryOptions(this.props);
    }

    componentDidUpdate(prevProps) {
        if (!this.state.options && prevProps.selectedOrgUnitId !== this.props.selectedOrgUnitId) {
            this.loadCagoryOptions(this.props);
        }
    }

    componentWillUnmount() {
        this.cancelablePromise && this.cancelablePromise.cancel();
        this.cancelablePromise = null;
    }

    loadCagoryOptions(props) {
        const { category, selectedOrgUnitId } = props;

        this.setState({
            options: null,
        });
        this.cancelablePromise && this.cancelablePromise.cancel();

        let currentRequestCancelablePromise;

        const isRequestAborted = () =>
            currentRequestCancelablePromise && this.cancelablePromise !== currentRequestCancelablePromise;

        currentRequestCancelablePromise = makeCancelablePromise(
            CategorySelector.getOptionsAsync(category.id, selectedOrgUnitId, isRequestAborted)
        );

        currentRequestCancelablePromise.promise
            .then(options => {
                options.sort((a, b) => {
                    if (a.label === b.label) {
                        return 0;
                    }
                    if (a.label < b.label) {
                        return -1;
                    }
                    return 1;
                });

                this.setState({
                    options,
                });
                this.cancelablePromise = null;
            })
            .catch(error => {
                if (!(error && (error.aborted || error.isCanceled))) {
                    log.error(errorCreator("An error occured loading category options")({ error }));
                    this.setState({
                        options: [],
                    });
                }
            });

        this.cancelablePromise = currentRequestCancelablePromise;
    }

    render() {
        const { selectedOrgUnitId, onSelect, ...passOnProps } = this.props;
        const { options } = this.state;
        const handleSelect = this.onSelectSelector({ options, onSelect });

        return (
            // $FlowFixMe[cannot-spread-inexact] automated comment
            <VirtualizedSelectLoadingIndicatorHOC
                options={options}
                value={""}
                placeholder={i18n.t("Select")}
                {...passOnProps}
                onSelect={handleSelect}
            />
        );
    }
}
