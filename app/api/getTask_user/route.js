import connect from '@/data/connect';
import PostTasks from '@/data/models/task';
import PostUser from '@/data/models/user';
import PostProject from '@/data/models/project';
import PostTaskcategories from '@/data/models/taskc';
import { Types } from 'mongoose';

/* -------- OPTIONS (CORS) -------- */
export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}

/* -------- POST /api/report-user -------- */
export async function POST(req) {
    try {
        const { id } = await req.json();
        if (!id) return json({ x: 1, m: 'Thiếu id' }, 200);

        await connect();

        let doerId;
        try {
            doerId = new Types.ObjectId(id);
        } catch {
            return json({ x: 1, m: 'id không hợp lệ' }, 200);
        }

        const user = await PostUser.findById(doerId);
        if (!user) return json({ x: 1, m: 'User không tồn tại' }, 200);

        const today = new Date();
        const begin = new Date(today.getFullYear(), today.getMonth() - 1, 5);

        const projects = await PostTasks.aggregate([
            { $match: { doer: doerId } },
            { $unwind: '$subTask' },
            {
                $addFields: {
                    subStart: {
                        $cond: [
                            { $eq: [{ $type: '$subTask.startDate' }, 'string'] },
                            { $toDate: '$subTask.startDate' },
                            '$subTask.startDate'
                        ]
                    },
                    subEnd: {
                        $cond: [
                            { $eq: [{ $type: '$subTask.endDate' }, 'string'] },
                            { $toDate: '$subTask.endDate' },
                            '$subTask.endDate'
                        ]
                    }
                }
            },
            { $match: { subStart: { $gte: begin }, subEnd: { $lte: today } } },
            { $group: { _id: '$project', subtasks: { $push: '$subTask' } } },
            { $project: { _id: 0, projectId: '$_id', subtasks: 1 } }
        ]);

        const projectIds = projects.map(p => p.projectId);
        const catIds = [...new Set(
            projects.flatMap(p => p.subtasks.map(s => s.taskCategory?.toString()))
        )];

        const [projectDocs, catDocs] = await Promise.all([
            PostProject.find({ _id: { $in: projectIds } }).select('name').lean(),
            PostTaskcategories.find({ _id: { $in: catIds } }).select('name').lean()
        ]);

        const projectMap = new Map(projectDocs.map(d => [d._id.toString(), d.name]));
        const catMap = new Map(catDocs.map(d => [d._id.toString(), d.name]));

        const result = projects.map(p => {
            const projectName = projectMap.get(p.projectId.toString()) || p.projectId;
            const subtasks = p.subtasks.map((s, i) => ({
                idx: i + 1,
                name: s.name ?? '',
                id: s._id.toString(),
                start: s.startDate,
                end: s.endDate,
                done: s.done ?? false,
                checkdone: s.checkdone ?? [],
                link: s.linkDrive ?? '',
                category: catMap.get((s.taskCategory || '').toString()) || '',
            }));

            return { projectName, subtasks };
        });

        return json({ x: 2, m: 'Lấy dữ liệu thành công', data: result });

    } catch (e) {
        return json({ x: 0, m: e.message, data: [] }, 500);
    }
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
