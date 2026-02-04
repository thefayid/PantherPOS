const DB_NAME = 'PantherPOS_Storage';
const STORE_NAME = 'database';
const DB_VERSION = 1;

export const dbStorage = {
    _db: null as IDBDatabase | null,

    async _getDb(): Promise<IDBDatabase> {
        if (this._db) return this._db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event: any) => {
                this._db = event.target.result;
                resolve(this._db!);
            };

            request.onerror = (event: any) => {
                reject(event.target.error);
            };
        });
    },

    async setItem(key: string, value: any): Promise<void> {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(event.target.error);
        });
    },

    async getItem(key: string): Promise<any | null> {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (event: any) => reject(event.target.error);
        });
    },

    async removeItem(key: string): Promise<void> {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(event.target.error);
        });
    },

    async clear(): Promise<void> {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(event.target.error);
        });
    }
};
