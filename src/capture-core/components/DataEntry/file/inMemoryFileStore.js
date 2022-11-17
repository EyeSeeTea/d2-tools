//

class InMemoryFileStore {
    constructor() {
        this.fileUrls = {};
    }

    get = fileId => this.fileUrls[fileId];

    set = (fileId, file) => {
        this.fileUrls[fileId] = URL.createObjectURL(file);
    };

    clear = () => {
        this.fileUrls = Object.keys(this.fileUrls).reduce((accFileUrls, fileId) => {
            URL.revokeObjectURL(this.fileUrls[fileId]);
            return accFileUrls;
        }, {});
    };
}

export const inMemoryFileStore = new InMemoryFileStore();
