//
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import isFunction from "d2-utilizr/lib/isFunction";
import { Program } from "./Program";

export class EventProgram extends Program {
    static EVENT_PROGRAM_STAGE_KEY = "EventProgramStage";

    constructor(initFn) {
        super();
        initFn && isFunction(initFn) && initFn(this);
    }

    set stage(stage) {
        this._stages.set(EventProgram.EVENT_PROGRAM_STAGE_KEY, stage);
    }
    get stage() {
        // $FlowFixMe[incompatible-return] automated comment
        return this._stages.get(EventProgram.EVENT_PROGRAM_STAGE_KEY);
    }

    getStage() {
        // $FlowFixMe[incompatible-return] automated comment
        return this._stages.get(EventProgram.EVENT_PROGRAM_STAGE_KEY);
    }
}
