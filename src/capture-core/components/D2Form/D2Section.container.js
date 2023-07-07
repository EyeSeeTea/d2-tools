//
import { connect } from "react-redux";
import { D2Section } from "./D2Section.component";

const mapStateToProps = (state, props) => {
    const fieldsHiddenByRules = state.rulesEffectsHiddenFields[props.formId];
    if (fieldsHiddenByRules) {
        const visibleFields = Array.from(props.sectionMetaData.elements.keys()).filter(
            id => !fieldsHiddenByRules[id]
        );

        return { isHidden: visibleFields.length == 0 };
    }

    return { isHidden: props.sectionMetaData.elements.size == 0 };
};

const mapDispatchToProps = () => ({});

// $FlowSuppress
// $FlowFixMe[missing-annot] automated comment
export const D2SectionContainer = connect(mapStateToProps, mapDispatchToProps)(D2Section);
