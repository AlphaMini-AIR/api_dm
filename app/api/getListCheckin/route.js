export async function POST(request) {
    try {
        const { userId, fromDate: inputFromDate, toDate: inputToDate } = await request.json();

        const now = new Date();
        const dd = (d) => (d < 10 ? '0' + d : d);
        const formatDate = (d) => `${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${d.getFullYear()}`;

        let fromDate, toDate;
        if (!inputFromDate || !inputToDate) {
            let fromDateObj;
            if (now.getDate() <= 5) {
                fromDateObj = new Date(now.getFullYear(), now.getMonth() - 1, 5);
            } else {
                fromDateObj = new Date(now.getFullYear(), now.getMonth(), 5);
            }
            fromDate = formatDate(fromDateObj);
            toDate = formatDate(now);
        } else {
            fromDate = inputFromDate;
            toDate = inputToDate;
        }

        const authRes = await fetch('https://api-auth.s4h.edu.vn/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'hoanghung.vam1209@gmail.com',
                password: 'jnmnha1412'
            }),
        });

        const authData = await authRes.json();
        const accessToken = authData.accessToken;

        const query = new URLSearchParams({ fromDate, toDate, userId }).toString();
        const checkinRes = await fetch(`https://checkin.s4h.edu.vn/api/CheckInList?${query}&draw=1&start=0&length=100`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        });

        const checkinData = await checkinRes.json();

        // Phân tích dữ liệu
        let totalHours = 0;
        let completedDays = 0;
        let uncompletedDays = 0;

        for (const record of checkinData.data || []) {
            const { checkedInAt, checkedOutAt, shift, isLate } = record;

            // Bỏ qua nếu thiếu 1 trong 2
            if (!checkedInAt || !checkedOutAt) continue;

            const inTime = new Date(checkedInAt);
            const outTime = new Date(checkedOutAt);

            let workedHours = (outTime - inTime) / (1000 * 60 * 60); // milliseconds to hours

            if (shift === 'fulltime') {
                workedHours -= 2; // trừ 2 tiếng nghỉ
            }

            workedHours = Math.max(0, workedHours); // tránh âm

            totalHours += workedHours;

            const isComplete = !isLate && checkedInAt && checkedOutAt;
            if (isComplete) {
                completedDays++;
            } else {
                uncompletedDays++;
            }
        }

        return new Response(
            JSON.stringify({
                air: 2,
                data: checkinData,
                summary: {
                    totalHours: parseFloat(totalHours.toFixed(2)),
                    completedDays,
                    uncompletedDays
                }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ air: 0, data: null, mes: error.message || error }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
