import { connectToDatabase } from '@/data/connectPass';
import Checkin from '@/data/models/checkin';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        await connectToDatabase();

        const { userId, dateStart, dateEnd } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'Thiếu userId' }, { status: 400, headers });
        }

        const allCheckins = await Checkin.find({ userId }).sort({ createdAt: -1 });

        let checkins = allCheckins;

        const regexDate = /^\d{2}\/\d{2}\/\d{4}$/;
        if (dateStart && dateEnd && regexDate.test(dateStart) && regexDate.test(dateEnd)) {
            const [dStart, mStart, yStart] = dateStart.split('/');
            const [dEnd, mEnd, yEnd] = dateEnd.split('/');
            const startDate = new Date(`${yStart}-${mStart}-${dStart}`);
            const endDate = new Date(`${yEnd}-${mEnd}-${dEnd}`);

            checkins = checkins.filter(item => {
                if (!item.date) return false;
                const [d, m, y] = item.date.split('/');
                const itemDate = new Date(`${y}-${m}-${d}`);
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        checkins = checkins.filter(item => item.shift && item.checkedInAt && item.checkedOutAt);

        let totalHours = 0;
        let completeSessions = 0;
        let incompleteSessions = 0;

        for (const record of checkins) {
            const { checkedInAt, checkedOutAt, shift, date } = record;
            const [dd, mm, yyyy] = date.split('/');
            const workDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

            const mStart = new Date(workDate); mStart.setUTCHours(0, 30);
            const mEnd = new Date(workDate); mEnd.setUTCHours(4, 30);

            const aStart = new Date(workDate); aStart.setUTCHours(6, 0);
            const aEnd = new Date(workDate); aEnd.setUTCHours(10, 0);

            const fullStart = new Date(workDate); fullStart.setUTCHours(0, 30);
            const fullEnd = new Date(workDate); fullEnd.setUTCHours(10, 0);
            const lateCutoff = new Date(workDate); lateCutoff.setUTCHours(0, 30);
            const earlyCutoff = new Date(workDate); earlyCutoff.setUTCHours(10, 0);

            const checkIn = new Date(checkedInAt);
            const checkOut = new Date(checkedOutAt);

            let workMinutes = 0;
            let isCompleted = false;

            if (shift === 'morning') {
                workMinutes = Math.floor((checkOut - checkIn) / 60000);
                isCompleted = checkIn <= mStart && checkOut >= mEnd;
            } else if (shift === 'afternoon') {
                workMinutes = Math.floor((checkOut - checkIn) / 60000);
                isCompleted = checkIn <= aStart && checkOut >= aEnd;
            } else if (shift === 'fulltime') {
                workMinutes = 8 * 60;

                if (checkIn < fullStart) {
                    workMinutes += Math.floor((fullStart - checkIn) / 60000);
                }

                if (checkOut > fullEnd) {
                    workMinutes += Math.floor((checkOut - fullEnd) / 60000);
                }

                if (checkIn > lateCutoff) {
                    const late = Math.floor((checkIn - lateCutoff) / 60000);
                    if (late > 5) workMinutes -= late;
                }

                if (checkOut < earlyCutoff) {
                    const early = Math.floor((earlyCutoff - checkOut) / 60000);
                    if (early > 5) workMinutes -= early;
                }

                workMinutes = Math.max(workMinutes, 0);
                isCompleted = workMinutes >= 8 * 60;
            }

            const workHours = workMinutes / 60;
            totalHours += workHours;

            if (isCompleted) completeSessions++;
            else incompleteSessions++;

            record.workHours = Number(workHours.toFixed(2));
            record.isCompleted = isCompleted;
        }

        return NextResponse.json({
            totalHours: Number(totalHours.toFixed(2)),
            completeSessions,
            incompleteSessions,
            checkins,
            ds: checkins.length
        }, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu checkin:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
