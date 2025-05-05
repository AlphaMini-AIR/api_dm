// app/api/schedule/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'data.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const scheduleList = JSON.parse(parsed.d[3]);

        const groupedByDate = {};

        scheduleList.forEach((item) => {
            const date = formatDate(item.Ngay); // yyyy-mm-dd

            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }

            groupedByDate[date].push({
                TenMonHoc: item.TenMonHoc,
                TenNhom: item.TenNhom,
                GiaoVien: item.GiaoVien,
                ThoiGian: stripHtml(item.Tu) + ' - ' + stripHtml(item.Den),
                Phong: item.TenPhong,
                CoSo: item.TenCoSo,
                Loai: item.ThoiGian.includes('Thực hành') ? 'Thực hành' : 'Lý thuyết',
                TinhTrang: getTinhTrang(item.TinhTrang),
            });
        });

        return NextResponse.json(groupedByDate);
    } catch (err) {
        return NextResponse.json({ error: 'Không thể đọc dữ liệu lịch học' }, { status: 500 });
    }
}

// Utility functions
function formatDate(dateStr) {
    // Ví dụ: "17032025" -> "2025-03-17"
    return `${dateStr.slice(4)}-${dateStr.slice(2, 4)}-${dateStr.slice(0, 2)}`;
}

function stripHtml(str) {
    return str.replace(/<[^>]+>/g, '');
}

function getTinhTrang(code) {
    switch (code) {
        case 0: return 'Học bình thường';
        case 1: return 'Đã học';
        case 2: return 'Nghỉ học';
        default: return 'Không xác định';
    }
}
