//
import * as React from "react";
import { pipe } from "capture-core-utils";
import { programCollection } from "../../metaDataMemoryStores";

// Filter programs based on organisation units and a baseline filter. Uses a render prop for children.
export class ProgramFilterer extends React.Component {
    static isBeingFiltered(basePrograms, filteredPrograms) {
        return basePrograms.length !== filteredPrograms.length;
    }

    constructor(props) {
        super(props);
        this.programs = Array.from(programCollection.values());
    }

    getBaselinePrograms(programs) {
        const { baselineFilter } = this.props;
        return programs.filter(program => baselineFilter(program));
    }

    filterPrograms = programs => {
        const { orgUnitIds } = this.props;

        return programs.filter(
            program => !orgUnitIds || orgUnitIds.some(id => program.organisationUnits[id])
        );
    };

    getPrograms(basePrograms) {
        return pipe(this.filterPrograms)(basePrograms);
    }

    render() {
        const { orgUnitIds, baselineFilter, children, ...passOnProps } = this.props;
        const basePrograms = this.getBaselinePrograms(this.programs);
        const filteredPrograms = this.getPrograms(basePrograms);

        return children(
            filteredPrograms,
            ProgramFilterer.isBeingFiltered(basePrograms, filteredPrograms),
            passOnProps
        );
    }
}
