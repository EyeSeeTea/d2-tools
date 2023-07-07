//
import * as React from "react";
import { getMenuColumnSettings } from "./getMenuColumnSettings";

export const withEndColumnMenu = () => InnerComponent =>
    class CustomEndCellHOC extends React.Component {
        getCustomEndCellBody = (row, props) => {
            const settings = getMenuColumnSettings();
            return settings.getCellBody(row, props);
        };

        getCustomEndCellHeader = (row, props) => {
            const settings = getMenuColumnSettings();
            return settings.getCellHeader && settings.getCellHeader(props);
        };

        render() {
            const settings = getMenuColumnSettings();
            return (
                // $FlowFixMe[cannot-spread-inexact] automated comment
                <InnerComponent
                    getCustomEndCellHeader={this.getCustomEndCellHeader}
                    getCustomEndCellBody={this.getCustomEndCellBody}
                    customEndCellHeaderStyle={settings.headerCellStyle}
                    customEndCellBodyStyle={settings.bodyCellStyle}
                    {...this.props}
                />
            );
        }
    };
