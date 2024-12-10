export class NonUsersException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NonUsersException";
    }
}
