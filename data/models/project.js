import { Schema, model, models } from 'mongoose'

const postProject = new Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    status: {
        type: Schema.Types.ObjectId,
    },
    piority: {
        type: Number,
    },
    checker: {
        type: Schema.Types.ObjectId,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    notes: {
        type: String,
    },
    doerDone: {
        type: Boolean
    },
    department: {
        type: [Schema.Types.ObjectId]
    },
    linkDrive: {
        type: String
    },
    members: {
        type: [Schema.Types.ObjectId]
    },
    calendarId: {
        type: String
    },
    leader: {
        type: [Schema.Types.ObjectId]
    },
    status: {
        type: String
    },
    noti: {
        type: Object
    }
}, { timestamps: true })

const PostProject = models.project || model('project', postProject)

export default PostProject