import PostUser from '@/data/models/user';
import connect from '@/data/connect';
import nodemailer from 'nodemailer';
import PostTasks from '@/data/models/task';

export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}

export async function GET() {
    try {
        await connect()

        const userIds = await PostUser.distinct('_id', { sendEmail: 1 });
        await Promise.all(
            userIds.map((id) =>
                fetch('http://localhost:3001/api/sendEmail', {
                    method: 'POST',
                    body: JSON.stringify({ id })
                })
            )
        );

        return new Response(
            JSON.stringify({ status: 2, data: userIds }),
            { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } },
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ ok: false, message: 'Lỗi gửi mail', error: err.message }),
            { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
        );
    }
}
