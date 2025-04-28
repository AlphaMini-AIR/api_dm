import { Schema, model, models } from 'mongoose'

const postTaskcategories = new Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    shouldCreateFolder: {
        type: Boolean
    }
}, { timestamps: false })

const PostTaskcategories = models.taskcategorie || model('taskcategorie', postTaskcategories)

export default PostTaskcategories