import mongoose from 'mongoose';

let isConnected = false;
export default async function connectDB() {
    if (isConnected) return;
    if (mongoose.connections[0].readyState) { isConnected = true; return }
    try {
        const db = await mongoose.connect("mongodb+srv://vamnaone:mUvy5dTT1HQYM7Fu@marketing.fyanx.mongodb.net/marketing" );
        isConnected = db.connections[0].readyState === 1;
    } catch (error) { throw new Error('Failed to connect to MongoDB' + error) }
}