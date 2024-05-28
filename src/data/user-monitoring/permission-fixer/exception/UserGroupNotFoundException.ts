class UserGroupNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserGroupNotFoundException";
    }
}
