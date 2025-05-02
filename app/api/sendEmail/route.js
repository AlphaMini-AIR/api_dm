import connect from '@/data/connect';
import PostTasks from '@/data/models/task';
import PostUser from '@/data/models/user';
import PostProject from '@/data/models/project';
import PostTaskcategories from '@/data/models/taskc';
import { Types } from 'mongoose';
import nodemailer from 'nodemailer';

const roles = [
  { label: 'Sinh viên', value: 1 },
  { label: 'Nhân viên', value: 2 },
  { label: 'Quản lý', value: 3 }
];

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

    /* id -> ObjectId */
    let doerId;
    try { doerId = new Types.ObjectId(id); }
    catch { return json({ x: 1, m: 'id không hợp lệ' }, 200); }

    const user = await PostUser.findById(doerId);
    if (!user) return json({ x: 1, m: 'User không tồn tại' }, 200);

    /* khoảng ngày */
    const today = new Date();
    const begin = new Date(today.getFullYear(), today.getMonth() - 1, 5);
    const viDate = d => new Date(d).toLocaleDateString('vi-VN');

    /* Lấy subtask */
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

    /* ---------- LẤY TÊN PROJECT & CATEGORY ---------- */
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

    /* ---------- TÍNH TRẠNG THÁI & THỐNG KÊ ---------- */
    let doneCnt = 0, todoCnt = 0, approvedCnt = 0, sessions = 0;
    const statusBadge = (t, c) => `<span style="padding:2px 6px;border-radius:4px;font-size:12px;background:${c};color:#fff">${t}</span>`;
    const colorOf = s => s === 'approved' ? '#16a34a' : s === 'done' ? '#3b82f6' : '#d97706';

    projects.forEach(p => {
      p.projectName = projectMap.get(p.projectId.toString()) || p.projectId;

      p.subtasks = p.subtasks.map((s, i) => {
        const lastCheck = s.checkdone?.at(-1)?.status ?? false;
        let code = 'pending', txt = 'Chưa hoàn thành';
        if (s.done) {
          if (lastCheck) { code = 'approved'; txt = 'Đã duyệt hoàn thành'; }
          else { code = 'done'; txt = 'Hoàn thành'; }
        }
        if (code === 'approved') approvedCnt++;
        else if (code === 'done') doneCnt++;
        else todoCnt++;
        sessions++;

        return {
          idx: i + 1,
          name: s.name ?? '',
          id: s._id.toString(),
          start: viDate(s.startDate),
          end: viDate(s.endDate),
          link: s.linkDrive ?? '',
          cat: catMap.get((s.taskCategory || '').toString()) || '',
          code, txt
        };
      });
    });

    /* ---------- RENDER BẢNG SUBTASK ---------- */
    const buildTable = sts => `
      <table>
        <thead>
          <tr>
            <th>#</th><th>Công&nbsp;việc</th><th>Bắt&nbsp;đầu</th><th>Kết&nbsp;thúc</th>
            <th>Trạng&nbsp;thái</th><th>Drive</th><th>Loại</th><th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          ${sts.map(s => `
            <tr>
              <td>${s.idx}</td><td>${s.name}</td><td>${s.start}</td><td>${s.end}</td>
              <td>${statusBadge(s.txt, colorOf(s.code))}</td>
              <td>${s.link ? `<a href="${s.link}">Link</a>` : ''}</td><td>${s.cat}</td>
              <td><a href='https://dm.s4h.edu.vn/sub_task/${s.id}' target="_blank">chi tiết<a></td>
            </tr>`).join('')}
        </tbody>  
      </table>`;

    const projectHTML = projects.map((p, i) => `
      <h3 style="margin:20px 6px;">${i + 1}. Dự án: ${p.projectName}</h3>
      ${buildTable(p.subtasks)}
    `).join('');

    console.log(projects[0].subtasks);

    /* ---------- FOOTER 4 Ô ---------- */
    const footer = `
      <table style="width:100%;border-collapse:separate;border-spacing:0;margin-top:24px">
        <tr>
          <td style="width:25%;background:#3b82f6;color:#fff;font-weight:bold;text-align:center;padding:18px;border-top-left-radius:8px;border-bottom-left-radius:8px">
            <div style="font-size:26px;line-height:1">${doneCnt}</div><div style="font-size:13px">Hoàn thành</div>
          </td>
          <td style="width:25%;background:#f59e0b;color:#fff;font-weight:bold;text-align:center;padding:18px">
            <div style="font-size:26px;line-height:1">${todoCnt}</div><div style="font-size:13px">Chưa hoàn thành</div>
          </td>
          <td style="width:25%;background:#16a34a;color:#fff;font-weight:bold;text-align:center;padding:18px">
            <div style="font-size:26px;line-height:1">${approvedCnt}</div><div style="font-size:13px">Đã duyệt</div>
          </td>
          <td style="width:25%;background:#8b5cf6;color:#fff;font-weight:bold;text-align:center;padding:18px;border-top-right-radius:8px;border-bottom-right-radius:8px">
            <div style="font-size:26px;line-height:1">${sessions}</div><div style="font-size:13px">Số ngày</div>
          </td>
        </tr>
      </table>`;

    const reportTitle = `Báo cáo tháng ${today.getMonth() + 1}/${today.getFullYear()} (Tiến độ: ${sessions / 26 * 100}%)`;
    const html = `
<!doctype html><html><head><meta charset="utf-8">
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.4;margin:0;padding:0}
h2{color:#2cbef0;margin:24px 0 8px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th,td{border:1px solid #ddd;padding:8px;font-size:14px}
th{background:#f5f5f5;text-align:left}
tr:nth-child(even){background:#fafafa}
a{color:#2563eb;text-decoration:none}
</style></head><body>
  <div style="max-width:800px;margin:auto;padding:24px">
    <h2>${reportTitle}</h2>
    <p>Từ ngày: <strong>${viDate(begin)}</strong> – <strong>${viDate(today)}</strong></p>
    <p>Người thực hiện: <strong>${user.Name}</strong></p>
    <p>Vai trò: <strong>${roles.find(r => r.value === user.Role)?.label || 'Chưa xác định'}</strong></p>
    ${footer}
    ${projectHTML || '<p><em>Không có subtask phù hợp.</em></p>'}
   
  </div>
</body></html>`;

    /* gửi mail */
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'contact@airobotic.edu.vn', pass: 'uowwajikcadyqmuk' }
    });

    await transporter.sendMail({
      from: process.env.BASE_FROM || 'contact@airobotic.edu.vn',
      to: user.Email,
      subject: reportTitle,
      html
    });
    await transporter.sendMail({
      from: process.env.BASE_FROM || 'contact@airobotic.edu.vn',
      to: 'nmson@lhu.edu.vn',
      subject: reportTitle,
      html
    });
    return json({ x: 2, m: "Báo cáo công việc đã được gửi qua email người dùng", data: user.Email });

  } catch (e) {
    return json({ x: 0, m: e.message, data: [] }, 500);
  }
}

/* helper */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
