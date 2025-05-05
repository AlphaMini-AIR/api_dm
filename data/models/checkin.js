// models/checkin.js
import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
    qrCodeId: String,
    locationId: String,
    userId: String,
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    date: String,
    shift: String,
    checkedInAt: Date,
    checkedOutAt: Date,
    photos: [String],
    isLate: Boolean,
    location: Object,
    userAgent: String,
    ipAddress: String,
    note: String,
    expiredAt: Date,
    submitKey: String,
    isSubmitted: Boolean,
    isBooking: Boolean
}, { timestamps: true, versionKey: false });

export default mongoose.models.Checkin || mongoose.model('Checkin', checkInSchema);
