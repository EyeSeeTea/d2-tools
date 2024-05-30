export class UserTemplateNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserTemplateNotFoundException";
    }
}
