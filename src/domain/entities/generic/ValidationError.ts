export type ValidationError<T> = {
    property: keyof T;
    errors: Array<{ code: string }>;
};
