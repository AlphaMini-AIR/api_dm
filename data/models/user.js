import { Schema, model, models } from 'mongoose'

const postUser = new Schema({
    Name: {
        type: String,
    },
    Address: {
        type: String,
    },
    Avt: {
        type: String,
    },
    Role: {
        type: Number,
    },
    Phone: {
        type: String,
    },
    Email: {
        type: String,
    },
    Password: {
        type: String,
    },
    Point: {
        type: Number
    },
})

const PostUser = models.user || model('user', postUser)

export default PostUser