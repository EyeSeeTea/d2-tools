//
import { Program, ProgramStage } from "../../../../metaData";

// had to add customColumnOrder as a non optional type or else it would not be removed. Also, if customColumnOrder is
// added as non optional to the ExtractedProps only (and not to EventWorkingListsReduxOutputProps),
// flow complaints about one them being optional.
