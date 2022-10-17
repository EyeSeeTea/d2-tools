//
import * as React from "react";

export const CaptureScrollHeight = props => {
    const { captureEl, extraTriggers } = props;
    const [height, setHeight] = React.useState(0);

    const updateHeight = React.useCallback(() => {
        setHeight(captureEl.current.scrollHeight);
    }, [captureEl]);

    React.useLayoutEffect(() => {
        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
        // https://github.com/facebook/create-react-app/issues/6880
        // eslint-disable-next-line
    }, [...extraTriggers, updateHeight]);

    return props.children(height);
};
