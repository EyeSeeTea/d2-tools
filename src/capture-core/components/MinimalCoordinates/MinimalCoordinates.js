//
import React from "react";

const toSixDecimal = value => (parseFloat(value) ? parseFloat(value).toFixed(6) : null);

export const MinimalCoordinates = ({ latitude, longitude }) => (
    <div>
        lat: {toSixDecimal(latitude)} <br />
        long: {toSixDecimal(longitude)}
    </div>
);
