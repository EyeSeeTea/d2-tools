//
import {} from "react";
import { connect } from "react-redux";
import { TeiSearchComponent } from "./TeiSearch.component";
import {
    requestSearchTei,
    searchFormValidationFailed,
    teiNewSearch,
    teiEditSearch,
    teiSearchResultsChangePage,
    setOpenSearchGroupSection,
} from "./actions/teiSearch.actions";
import { makeSearchGroupsSelector } from "./teiSearch.selectors";

const makeMapStateToProps = () => {
    const searchGroupsSelector = makeSearchGroupsSelector();

    const mapStateToProps = (state, props) => {
        const searchGroups = searchGroupsSelector(state, props);
        const currentTeiSearch = state.teiSearch[props.id];
        return {
            searchGroups,
            showResults: !!currentTeiSearch.searchResults,
            selectedProgramId: currentTeiSearch.selectedProgramId,
            selectedTrackedEntityTypeId: currentTeiSearch.selectedTrackedEntityTypeId,
            openSearchGroupSection: currentTeiSearch.openSearchGroupSection,
        };
    };

    // $FlowFixMe[not-an-object] automated comment
    return mapStateToProps;
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSearch: (formId, searchGroupId, searchId) => {
        dispatch(requestSearchTei(formId, searchGroupId, searchId, ownProps.resultsPageSize));
    },
    onSearchResultsChangePage: (searchId, pageNumber) => {
        dispatch(teiSearchResultsChangePage(searchId, pageNumber, ownProps.resultsPageSize));
    },
    onSearchValidationFailed: (formId, searchGroupId, searchId) => {
        dispatch(searchFormValidationFailed(formId, searchGroupId, searchId));
    },
    onNewSearch: searchId => {
        dispatch(teiNewSearch(searchId));
    },
    onEditSearch: searchId => {
        dispatch(teiEditSearch(searchId));
    },
    onSetOpenSearchGroupSection: (searchId, searchGroupId) => {
        dispatch(setOpenSearchGroupSection(searchId, searchGroupId));
    },
});

export const TeiSearch = connect(makeMapStateToProps, mapDispatchToProps)(TeiSearchComponent);
