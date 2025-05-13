import mongoose from 'mongoose';

global.__mongoCache = global.__mongoCache || {
    conns: new Map(),  
    promises: new Map(),  
};

const { conns, promises } = global.__mongoCache;

export async function connectDB(uri, opts = {}) {
    if (!uri) throw new Error('MongoDB URI is required');

    const cached = conns.get(uri);
    if (cached && cached.readyState === 1) return cached;

    const pending = promises.get(uri);
    if (pending) return pending;

    const connectPromise = mongoose
        .createConnection(uri, {
            maxPoolSize: 10,  
            minPoolSize: 1,
            ...opts,
        })
        .asPromise()             
        .then((conn) => {
            conns.set(uri, conn);   
            promises.delete(uri);   
            return conn;
        })
        .catch((err) => {
            promises.delete(uri);
            throw err;
        });

    promises.set(uri, connectPromise);
    return connectPromise;
}
