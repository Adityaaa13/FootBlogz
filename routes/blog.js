const { Router } = require("express");
const multer=require("multer");
const path = require("path");

const Blog= require("../models/blog");
const Comment = require("../models/comment");


const router = Router();

//uploading the images in blogs
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(`./public/uploads/`));
    },
    filename: function (req, file, cb) {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  });
  const upload = multer({ storage: storage });

//
router.get('/add-new',(req,res)=>{
    return res.render('addBlog',{
        user:req.user,
    });
});


//edit
router.get('/edit/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).send('Blog not found');
  }
  return res.render('editBlog', {
    user: req.user,
    blog,
  });
});

//posting edited blog
router.post('/edit/:id', upload.single('coverImage'), async (req, res) => {
  const { title, body} = req.body;
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).send('Blog not found');
  }

  blog.title = title;
  blog.body = body;

  if (req.file) {
    blog.coverImageURL = `/uploads/${req.file.filename}`;
  }
  await blog.save();
  return res.redirect(`/blog/${blog._id}`);
});


//delete
router.get('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Blog.findByIdAndDelete(id);
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});



router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
    
  });
})

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});


router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: req.file ? `/uploads/${req.file.filename}` : null,
  });
  return res.redirect(`/blog/${blog._id}`);
});


module.exports = router;
