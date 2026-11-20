import mongoose from 'mongoose';

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) throw new Error('MONGODB_URI must be configured.');

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(mongodbUri, { bufferCommands: false });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        console.error('MongoDB connection failed (' + errorName + '). Check database configuration and network access.');
        throw new Error('MongoDB connection failed. Check database configuration and network access.');
    }

    console.info('MongoDB connected (' + (process.env.NODE_ENV ?? 'environment unspecified') + ').');
    return cached.conn;
};
