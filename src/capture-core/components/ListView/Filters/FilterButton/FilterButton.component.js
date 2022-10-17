//
import React, { memo } from "react";
import { FilterButtonContextConsumer } from "./FilterButtonContextConsumer.component";

export const FilterButton = memo(props => <FilterButtonContextConsumer {...props} />);
