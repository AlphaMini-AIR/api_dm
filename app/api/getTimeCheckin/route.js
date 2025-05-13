import { connectDB } from '@/data/connect';
import { getCheckinModel } from '@/data/models/checkin';
import { json, OPTIONS } from '@/lib/cors.js';

export { OPTIONS };

export async function POST(req) {
    try {
        const { userId, dateStart, dateEnd } = await req.json();
        console.log(userId);

        if (!userId) return json({ error: 'Thiếu userId' }, { status: 400 });

        const conn = await connectDB(process.env.DATA_CHECKIN,
            { dbName: 'checkin_service' }
        );
        const Checkin = getCheckinModel(conn);

        const query = { userId };
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;

        if (dateStart && dateEnd && regex.test(dateStart) && regex.test(dateEnd)) {
            const [d1, m1, y1] = dateStart.split('/');
            const [d2, m2, y2] = dateEnd.split('/');
            query.checkedInAt = {
                $gte: new Date(`${y1}-${m1}-${d1}T00:00:00Z`),
                $lte: new Date(`${y2}-${m2}-${d2}T23:59:59Z`),
            };
        }

        const raw = await Checkin.find(query)
            .where('shift').in(['morning', 'afternoon', 'fulltime'])
            .where('checkedOutAt').ne(null)
            .sort({ createdAt: -1 })
            .lean();

        const MS = 60_000;
        let totalMins = 0;
        let complete = 0;
        let incomp = 0;

        const result = raw
            .map(r => {
                const { shift, checkedInAt, checkedOutAt, date } = r;
                if (!shift || !date) return null;

                const [dd, mm, yyyy] = date.split('/');
                const base = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);

                const SLOT = {
                    morning: { start: 30, end: 270 },
                    afternoon: { start: 360, end: 600 },
                    fulltime: { start: 30, end: 600 },
                }[shift];

                const inT = new Date(checkedInAt);
                const outT = new Date(checkedOutAt);
                let work = Math.floor((outT - inT) / MS);
                let ok = false;

                if (shift === 'fulltime') {
                    const lateCut = new Date(base.getTime() + SLOT.start * MS);
                    const earlyCut = new Date(base.getTime() + SLOT.end * MS);

                    if (inT < lateCut) work += Math.floor((lateCut - inT) / MS);
                    if (outT > earlyCut) work += Math.floor((outT - earlyCut) / MS);

                    if (inT > lateCut) {
                        const late = Math.floor((inT - lateCut) / MS);
                        if (late > 5) work -= late;
                    }
                    if (outT < earlyCut) {
                        const early = Math.floor((earlyCut - outT) / MS);
                        if (early > 5) work -= early;
                    }
                    work = Math.max(work, 0);
                    ok = work >= 8 * 60;
                } else {
                    const winStart = new Date(base.getTime() + SLOT.start * MS);
                    const winEnd = new Date(base.getTime() + SLOT.end * MS);
                    ok = inT <= winStart && outT >= winEnd;
                }

                totalMins += work;
                ok ? complete++ : incomp++;

                return { ...r, workHours: Number((work / 60).toFixed(2)), isCompleted: ok };
            })
            .filter(Boolean);

        return json({
            totalHours: Number((totalMins / 60).toFixed(2)),
            completeSessions: complete,
            incompleteSessions: incomp,
            checkins: result,
            ds: result.length,
        });

    } catch (err) {
        console.error('❌ Lỗi check‑in report:', err);
        return json({ error: 'Lỗi server' }, { status: 500 });
    }
}
