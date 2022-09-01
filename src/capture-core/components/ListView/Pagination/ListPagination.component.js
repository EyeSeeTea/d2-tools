//
import React, { memo } from "react";
import { ListPaginationContextConsumer } from "./ListPaginationContextConsumer.component";

export const ListPagination = memo(props => <ListPaginationContextConsumer {...props} />);
