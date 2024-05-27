import { deleteDB, IDBPDatabase, IDBPObjectStore, openDB } from 'idb'

const indexedDBCaches: string[] = []

export class Caches {
    static async set(forceIndexedDb: boolean, ...args: (string | Record<string, unknown> | Record<string, unknown>[])[]): Promise<void> {
        for (let i = 0; i < args.length; i++) {
            const maxStorageSize = 1024 * 1024 * 5 - JSON.stringify(sessionStorage).length
            const storage = JSON.stringify(args[i + 1])
            if ((storage && storage.length >= maxStorageSize) || forceIndexedDb) {
                const key = <string>args[i]
                const db = await openDB(<string>args[i], 1, { upgrade: (db: IDBPDatabase): IDBPObjectStore<unknown, ArrayLike<string>, string, 'versionchange'> => db.createObjectStore(<string>args[i]) })
                indexedDBCaches.push(key)
                const transaction = db.transaction(key, 'readwrite')
                const objectStore = transaction.objectStore(key)
                await objectStore.put(args[i + 1], key)
                db.close()
                return
            }
            if (i % 2 === 0) sessionStorage.setItem(args[i] as string, storage)
        }
    }

    static async get(...args: string[]): Promise<Record<string, unknown> | Record<string, unknown>[]> {
        let datas = []
        for (const arg of args) {
            if (indexedDBCaches.includes(arg)) {
                const db = await openDB(arg, 1)
                datas.push(await db.transaction(arg).objectStore(arg).get(arg))
            } else datas.push(JSON.parse(<string>sessionStorage.getItem(arg)))
        }
        datas = datas.filter((pEntry): IDBPDatabase => pEntry)
        return datas.length === 1 && datas.length === args.length ? datas[0] : datas.length && datas.length === args.length ? datas : null
    }
}

window.addEventListener('beforeunload', (): void => indexedDBCaches.forEach((dbName): Promise<void> => deleteDB(dbName)))
