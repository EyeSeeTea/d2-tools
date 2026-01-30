export interface BulkDeleteDEsRepository {
    getDEsToDelete(csv: string): Promise<string[]>;
}