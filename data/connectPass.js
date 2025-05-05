// lib/mongoose.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.1.55:27017/checkin_service';

let isConnected = false;

export async function connectToDatabase() {
    if (isConnected) return;

    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('✅ Mongoose đã kết nối MongoDB');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        throw error;
    }
}
