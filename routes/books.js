const express = require ('express');
const router = express.Router();
const Book = require('../models/book');

const fs = require('fs');

const Author = require('../models/author');
const { request } = require('express');
const imageMimeTypes = ['image/jpeg','image/png','image/gif'];
const docMimeTypes = ['application/pdf'];

//All books route
router.get("/",async (req,res) => {
    let query = Book.find();
    if (req.query.title != null && req.query.title != ''){
        query= query.regex('title', new RegExp(req.query.title,'i'));

    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query= query.lte('publishDate',req.query.publishedBefore);
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query= query.gte('publishDate',req.query.publishedAfter);
    }
    try{
        const books = await query.exec();
        res.render("books/index",{
        books:books,
        searchOptions: req.query
    })
    }
    catch{
        res.redirect('/');
    }
    
})

//New books Route
router.get("/new", async (req,res) => {
    renderNewPage(res,new Book());
})

router.get("/:id/download", async (req,res) => {
    
    let book;
    try{
        book = await Book.findById(req.params.id);
        const fileData = book.bookDoc;
  const fileName = book.title+'.pdf';
  const fileType = 'application/pdf'

  res.writeHead(200, {
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Type': fileType,
  })

  const download = Buffer.from(fileData, 'base64')
  res.end(download)
        
    }
    catch(err){
        console.log(err);
        res.redirect('/')   
    }
})

//Create Book Route
router.post('/',async (req,res)=>{
    const book = new Book({
        title: req.body.title,
        author:req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount:req.body.pageCount,
        description: req.body.description,
    })
    saveCover(book,req.body.cover)
    savePDF(book,req.body.bookpdf)
    try{
        const newBook = await book.save();
        res.redirect(`books/${newBook.id}`);
    }
    catch{
        renderNewPage(res,book,true);
    }

})



//Show book Route
router.get("/:id", async (req,res)=> {
    try{
        const book = await Book.findById(req.params.id).populate('author').exec();
        res.render('books/show',{
            book:book
        })
    }
    catch{
        res.redirect('/')
    }
})


//Update book route
router.put('/:id',async (req,res)=>{
    let book;
    try{
        book = await Book.findById(req.params.id);
        book.title=req.body.title;
        book.author=req.body.author;
        book.publishDate=new Date(req.body.publishDate);
        book.pageCount=req.body.pageCount;
        book.description=req.body.description;
        if (req.body.cover != null && req.body.cover !== ''){
            saveCover(book,req.body.cover)
        }
        if (req.body.bookpdf != null && req.body.bookpdf !== ''){
            savePDF(book,req.body.bookpdf)
        }
        await book.save()
        res.redirect(`/books/${book.id}`);
    }
    catch(err){
        console.log(error);
        if (book!=null){
            renderEditPage(res,book,true);
        }else{
            res.redirect('/');
        }
        
    }

})


//Edit book route
router.get("/:id/edit", async (req,res) => {
    try{
        const book = await Book.findById(req.params.id);
        renderEditPage(res,book);
    }
    catch{
        res.redirect('/')
    }
    
    
})

//Delete Book
router.delete('/:id', async(req,res) => {
    let book;
    try{
        book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books')
    }
    catch{
        if (book!=null){
            res.redirect('books/show', {
                book:book,
                errorMsg: 'Could not remove Book'
            })
        }
        else{
            res.redirect('/');
        }

    }
})

async function renderNewPage(res,book,hasError = false){
    renderFormPage(res,book,'new',hasError);
}

async function renderEditPage(res,book,hasError = false){
    renderFormPage(res,book,'edit',hasError);
}

async function renderFormPage(res,book,form,hasError = false){
    try{
        const authors =await Author.find({});
        const params={
            authors: authors,
            book:book
        }
        if (hasError){
            if (form==='edit')
                params.errorMsg = 'Error Updating Book'
            else
                params.errorMsg = 'Error Creating Book'
        }
        res.render(`books/${form}`, params)
    }
    catch{
        res.redirect('/books');
    }
}
function saveCover(book, coverEncoded){
    if (coverEncoded == null) return;
    const cover = JSON.parse(coverEncoded);
    if (cover != null && imageMimeTypes.includes(cover.type)){
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type;
    }
}

function savePDF(book, bookpdfEncoded){
    if (bookpdfEncoded == null) return;
    const bookpdf = JSON.parse(bookpdfEncoded);
    if (bookpdf!=null && docMimeTypes.includes(bookpdf.type)){
        book.bookDoc = new Buffer.from(bookpdf.data, 'base64')
        book.bookDocType = bookpdf.type;
    }
}

module.exports = router;