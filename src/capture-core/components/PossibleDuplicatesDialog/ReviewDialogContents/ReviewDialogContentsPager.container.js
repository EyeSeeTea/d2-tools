//
import {} from "react";
import { connect } from "react-redux";
import { ReviewDialogContentsPagerComponent } from "./ReviewDialogContentsPager.component";

const mapStateToProps = state => ({
    currentPage: state.possibleDuplicates.currentPage,
});

const mapDispatchToProps = () => ({});

export const ReviewDialogContentsPager = connect(
    mapStateToProps,
    mapDispatchToProps
)(ReviewDialogContentsPagerComponent);
