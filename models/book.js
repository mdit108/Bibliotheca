const mongoose = require ("mongoose");


const bookSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type:String, 
    },
    publishDate:{
        type:Date,
        required:true
    },
    pageCount:{
        type: Number,
        required:true
    },
    createdAt:{
        type: Date,
        required:true,
        default: Date.now
    },
    coverImage:{
        type: Buffer,
        required: true
    },
    coverImageType: {
        type: String,
        required: true,
    },
    bookDoc:{
        type: Buffer,
        required: true
    },
    bookDocType: {
        type: String,
        required: true,
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Author'
    }
})

bookSchema.virtual('coverImagePath').get(function(){
    if (this.coverImage != null && this.coverImageType != null){
        return `data:${this.coverImageType};charset=utf-8;base64,${this.coverImage.toString('base64')}`
    }
})

bookSchema.virtual('bookDocPath').get(function(){
    if (this.bookDoc != null && this.bookDocType != null){
        return `data:${this.bookDocType};charset=utf-8;base64,${this.bookDoc.toString('base64')}`
    }
})

module.exports = mongoose.model('Book',bookSchema);
