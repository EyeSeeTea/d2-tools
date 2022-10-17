//
export function DisplayException(message, innerError) {
    this.message = message;
    this.innerError = innerError;
    this.toString = () => this.message;
}
