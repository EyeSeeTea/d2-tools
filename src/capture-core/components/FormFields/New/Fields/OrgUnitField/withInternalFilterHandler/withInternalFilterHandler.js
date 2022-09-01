//
import * as React from "react";
import log from "loglevel";
import { makeCancelablePromise, errorCreator } from "capture-core-utils";

import { getD2 } from "../../../../../../d2/d2Instance";
import { orgUnitFieldScopes } from "./scopes.const";

// Handles organisation unit filtering internally in this component.
export const withInternalFilterHandler = () => InnerComponent =>
    class OrgUnitInternalFilterHandlerHOC extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                filteredRoots: null,
                filterText: null,
                inProgress: false,
                treeKey: OrgUnitInternalFilterHandlerHOC.INITIAL_TREE_KEY,
            };
            this.cancelablePromise = null;
        }

        componentWillUnmount() {
            if (this.cancelablePromise) {
                this.cancelablePromise.cancel();
            }
        }

        static INITIAL_TREE_KEY = "initial";

        filterOrgUnits(filterText) {
            const { scope, onSearchError } = this.props;
            const hierarchyProp =
                scope === orgUnitFieldScopes.USER_CAPTURE
                    ? { withinUserHierarchy: true }
                    : { withinUserSearchHierarchy: true };
            this.setState({
                inProgress: true,
            });

            if (this.cancelablePromise) {
                this.cancelablePromise.cancel();
            }

            const cancelablePromise = makeCancelablePromise(
                getD2().models.organisationUnits.list({
                    fields: [
                        "id,displayName,path,publicAccess,access,lastUpdated",
                        "children[id,displayName,publicAccess,access,path,children::isNotEmpty]",
                    ].join(","),
                    paging: false,
                    query: filterText,
                    ...hierarchyProp,
                })
            );

            cancelablePromise.promise
                .then(orgUnitCollection => {
                    this.setState({
                        filteredRoots: orgUnitCollection.toArray(),
                        filterText,
                        inProgress: false,
                        treeKey: filterText,
                    });
                    this.cancelablePromise = null;
                })
                .catch(error => {
                    log.error(
                        errorCreator("There was an error retrieving organisation unit roots")({ error })
                    );
                    onSearchError && onSearchError(error);
                });

            this.cancelablePromise = cancelablePromise;
        }

        resetOrgUnits() {
            this.setState({
                filteredRoots: null,
                filterText: null,
                treeKey: OrgUnitInternalFilterHandlerHOC.INITIAL_TREE_KEY,
            });
        }

        handleFilterChange = searchText => {
            if (searchText) {
                this.filterOrgUnits(searchText);
            } else {
                this.resetOrgUnits();
            }
        };

        render() {
            const { defaultRoots, onSearchError, onSelect, scope, ...passOnProps } = this.props;
            const { filteredRoots, filterText, treeKey, inProgress } = this.state;
            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent
                    roots={filteredRoots || defaultRoots}
                    treeKey={treeKey}
                    searchText={filterText}
                    ready={!inProgress}
                    onSearch={this.handleFilterChange}
                    onBlur={onSelect}
                    {...passOnProps}
                />
            );
        }
    };
