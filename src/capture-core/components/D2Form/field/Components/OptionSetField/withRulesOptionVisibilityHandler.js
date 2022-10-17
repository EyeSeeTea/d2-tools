//
import * as React from "react";
import { connect } from "react-redux";
import {} from "../../../../../metaData";
import { makeGetOptionsVisibility } from "./rulesOptionsVisibility.selectors";

const effectKeys = {
    SHOW_OPTION_GROUPS: "showOptionGroups",
    HIDE_OPTION_GROUPS: "hideOptionGroups",
    HIDE_OPTIONS: "hideOptions",
};

const allFilters = [
    {
        key: effectKeys.SHOW_OPTION_GROUPS,
        createFilter: (showGroupEffects, optionGroups) => {
            const showOptionGroups = showGroupEffects.map(effect => optionGroups.get(effect.optionGroupId));

            return option => showOptionGroups.some(og => og && !!og.optionIds.get(option.id));
        },
    },
    {
        key: effectKeys.HIDE_OPTION_GROUPS,
        createFilter: (hideGroupEffects, optionGroups) => {
            const hideOptionGroups = hideGroupEffects.map(effect => optionGroups.get(effect.optionGroupId));
            return option => !hideOptionGroups.some(og => og && !!og.optionIds.get(option.id));
        },
    },
    {
        key: effectKeys.HIDE_OPTIONS,
        createFilter: hideOptionEffects => option => !hideOptionEffects.some(o => o.optionId === option.id),
    },
];

const getCreateRulesOptionsVisibilityHandlerHOC = InnerComponent =>
    class CreateRulesOptionsVisibilityHandlerHOC extends React.Component {
        static getFilteredOptions = props => {
            const { options, rulesOptionsVisibility, optionGroups } = props;

            const filters = allFilters
                .filter(f => rulesOptionsVisibility[f.key] && rulesOptionsVisibility[f.key].length > 0)
                // $FlowFixMe
                .map(f => f.createFilter(rulesOptionsVisibility[f.key], optionGroups));

            // $FlowFixMe[missing-annot] automated comment
            return options.filter(option => filters.every(f => f(option)));
        };

        constructor(props) {
            super(props);

            this.filteredOptions = CreateRulesOptionsVisibilityHandlerHOC.getFilteredOptions(props);
        }

        UNSAFE_componentWillReceiveProps(newProps) {
            if (newProps.rulesOptionsVisibility !== this.props.rulesOptionsVisibility) {
                this.filteredOptions = CreateRulesOptionsVisibilityHandlerHOC.getFilteredOptions(newProps);
            }
        }

        render() {
            const { options, ...passOnProps } = this.props;

            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent options={this.filteredOptions} {...passOnProps} />
            );
        }
    };

const makeMapStateToProps = () => {
    const getOptionsVisibility = makeGetOptionsVisibility();

    const mapStateToProps = (state, props) => ({
        rulesOptionsVisibility: getOptionsVisibility(state, props),
    });
    // $FlowFixMe[not-an-object] automated comment
    return mapStateToProps;
};

export const withRulesOptionVisibilityHandler = () => InnerComponent =>
    // $FlowFixMe[missing-annot] automated comment
    connect(makeMapStateToProps, () => ({}))(getCreateRulesOptionsVisibilityHandlerHOC(InnerComponent));
