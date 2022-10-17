//
import { useState, useEffect } from "react";
import { buildFormFoundation } from "../FormFoundation";

export const useFormFoundation = programAPI => {
    const [formFoundation, setFormFoundation] = useState({});

    useEffect(() => {
        buildFormFoundation(programAPI, setFormFoundation);
    }, [programAPI]);

    return formFoundation;
};
