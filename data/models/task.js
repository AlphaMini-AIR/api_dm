import { Schema, model, models } from 'mongoose'

const FeedbackSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    createBy: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    title: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const CheckdoneSchema = new Schema({
    point: { type: Number, default: 0 },
    checkBy: { type: Schema.Types.ObjectId },
    checkAt: { type: Date, default: Date.now },
    status: { type: Boolean }
});

// SubTask Schema
const SubTaskSchema = new Schema({
    name: { type: String },
    feedback: [FeedbackSchema],
    taskCategory: { type: Schema.Types.ObjectId },
    startDate: { type: String },
    endDate: { type: String },
    detail: { type: String },
    notes: { type: String },
    doer: { type: Schema.Types.ObjectId },
    done: { type: Boolean },
    checkdone: [CheckdoneSchema],
    foundation: { type: Array, default: [] },
    publist: { type: Schema.Types.ObjectId, default: null }
});

const postTask = new Schema({
    name: { type: String },
    project: { type: Schema.Types.ObjectId },
    detail: { type: String },
    doer: { type: Schema.Types.ObjectId },
    checker: { type: Schema.Types.ObjectId },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String },
    doerDone: { type: Boolean, default: false },
    checkerDone: { type: Boolean, default: false },
    linkDrive: { type: String },
    taskCategory: { type: Schema.Types.ObjectId },

    subTask: [SubTaskSchema]
}, { timestamps: true });

const PostTasks = models.task || model('task', postTask)
export default PostTasks
