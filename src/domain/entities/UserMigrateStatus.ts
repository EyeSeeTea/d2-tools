export type MigrationResult = {
    stats: {
        ignored: number;
        updated: number;
    };
    errorMessage: string;
};
