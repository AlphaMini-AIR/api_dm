// models/checkin.js
import mongoose from 'mongoose';

export const checkInSchema = new mongoose.Schema(
    {
        qrCodeId: String,
        locationId: String,
        userId: String,
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        /** Nên để Date thay vì String nếu đây là ngày check‑in */
        date: String,
        shift: String,
        checkedInAt: Date,
        checkedOutAt: Date,
        photos: [String],
        isLate: Boolean,
        /** dùng Schema.Types.Mixed để rõ ràng hơn */
        location: Object,
        userAgent: String,
        ipAddress: String,
        note: String,
        expiredAt: Date,
        submitKey: String,
        isSubmitted: Boolean,
        isBooking: Boolean,
    },
    { timestamps: true, versionKey: false }
);

export function getCheckinModel(conn) {
    return conn.models.Checkin || conn.model('Checkin', checkInSchema);
}
