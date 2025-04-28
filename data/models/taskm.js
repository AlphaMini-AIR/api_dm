import { Schema, model, models } from 'mongoose'

const CheckdoneSchema = new Schema({
    status: { type: Number, default: 0 },
    at: { type: Date },
    doer: { type: Schema.Types.ObjectId, default: null }
});

const posttaskmore = new Schema({
    name: {
        type: String,
    },
    status: { type: Boolean },
    type: {
        type: Schema.Types.ObjectId
    },
    deadline: {
        type: Date,
    },
    contact: {
        type: String,
    },
    link: {
        type: String
    },
    description: {
        type: String,
    },
    done: { type: Boolean, default: false },
    checkdone: [CheckdoneSchema],
    createdBy: {
        type: Schema.Types.ObjectId
    },
    doer: {
        type: Schema.Types.ObjectId,
        default: null
    },
    sub: {
        type: Schema.Types.ObjectId,
        default: null
    },
    request: {
        type: String,
    },
    point: {
        type: Number, default: 0
    },
    interest: {
        type: String
    }
}, { timestamps: true })

const Posttaskmore = models.taskmore || model('taskmore', posttaskmore)

export default Posttaskmore