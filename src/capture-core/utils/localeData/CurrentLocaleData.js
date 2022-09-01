//

export class CurrentLocaleData {
    // $FlowFixMe[missing-annot] automated comment

    static set(data) {
        CurrentLocaleData.currentData = data;
    }
    static get() {
        return CurrentLocaleData.currentData;
    }
}
