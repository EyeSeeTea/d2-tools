//

import React from "react";
import i18n from "@dhis2/d2-i18n";
import { withStyles } from "@material-ui/core";
import { Pagination } from "capture-ui";
import { withNavigation } from "../../../../Pagination/withDefaultNavigation";
import { Button } from "../../../../Buttons/Button.component";
import { makeAttributesSelector } from "./teiRelationshipSearchResults.selectors";
import { CardList } from "../../../../CardList";

import { SearchResultsHeader } from "../../../../SearchResultsHeader";
import {} from "../../../../../metaData";
import { ResultsPageSizeContext } from "../../../shared-contexts";

const SearchResultsPager = withNavigation()(Pagination);

const getStyles = theme => ({
    itemActionsContainer: {
        paddingTop: theme.typography.pxToRem(10),
    },
    pagination: {
        display: "flex",
        justifyContent: "flex-end",
        marginLeft: theme.typography.pxToRem(8),
        maxWidth: theme.typography.pxToRem(600),
    },
    topSection: {
        display: "flex",
        flexDirection: "column",
        margin: theme.typography.pxToRem(8),
        marginRight: 0,
        backgroundColor: theme.palette.grey.lighter,
        maxWidth: theme.typography.pxToRem(600),
    },
    topSectionValuesContainer: {
        padding: theme.typography.pxToRem(10),
    },
    actionButton: {
        margin: theme.typography.pxToRem(10),
        color: theme.palette.primary.dark,
        borderRadius: 0,
        border: `1px solid ${theme.palette.primary.dark}`,
    },
});

const CardListButton = ({ handleOnClick, teiId }) => (
    <Button small dataTest={`relationship-tei-link-${teiId}`} onClick={handleOnClick}>
        {i18n.t("Link")}
    </Button>
);

class TeiRelationshipSearchResultsPlain extends React.Component {
    constructor(props) {
        super(props);
        this.getAttributes = makeAttributesSelector();
    }

    onAddRelationship = item => {
        this.props.onAddRelationship(item.id, item.values);
    };

    renderResults = () => {
        const attributes = this.getAttributes(this.props);
        const { teis, trackedEntityTypeName, selectedProgramId } = this.props;

        return (
            <React.Fragment>
                {this.renderTopSection()}
                <CardList
                    currentProgramId={selectedProgramId}
                    items={teis}
                    dataElements={attributes}
                    noItemsText={i18n.t("No {{trackedEntityTypeName}} found.", {
                        trackedEntityTypeName,
                        interpolation: { escapeValue: false },
                    })}
                    renderCustomCardActions={({ item }) => (
                        <CardListButton teiId={item.id} handleOnClick={() => this.onAddRelationship(item)} />
                    )}
                />
                {this.renderPager()}
            </React.Fragment>
        );
    };

    getSearchValues = () => {
        const { searchValues, searchGroup } = this.props;
        const searchForm = searchGroup.searchForm;
        return Object.keys(searchValues)
            .filter(key => searchValues[key] !== null)
            .map(key => {
                const element = searchForm.getElement(key);
                const value = searchValues[key];
                return { name: element.formName, value, id: element.id, type: element.type };
            });
    };

    renderTopSection = () => {
        const { onNewSearch, onEditSearch, classes } = this.props;
        return (
            <div className={classes.topSection}>
                <SearchResultsHeader currentSearchTerms={this.getSearchValues()} />
                <div>
                    <Button className={classes.actionButton} onClick={onNewSearch}>
                        {i18n.t("New search")}
                    </Button>
                    <Button className={classes.actionButton} onClick={onEditSearch}>
                        {i18n.t("Edit search")}
                    </Button>
                </div>
            </div>
        );
    };

    renderPager = () => {
        const { onChangePage, currentPage, classes, teis } = this.props;
        return (
            <ResultsPageSizeContext.Consumer>
                {({ resultsPageSize }) => (
                    <div className={classes.pagination}>
                        <SearchResultsPager
                            nextPageButtonDisabled={teis.length < resultsPageSize}
                            onChangePage={page => onChangePage(page)}
                            currentPage={currentPage}
                        />
                    </div>
                )}
            </ResultsPageSizeContext.Consumer>
        );
    };

    render() {
        return <div>{this.renderResults()}</div>;
    }
}

export const TeiRelationshipSearchResults = withStyles(getStyles)(TeiRelationshipSearchResultsPlain);
