const express = require('express');
// const { createPost } = require('../controllers/post-controller');
const {createPost, getAllPost, getPost, deletPostbyId, deletePosts } = require('../controllers/post-controller');
const { authUserReq } = require('../middleware/authUser');
const router = express.Router();

//auth middleware for user to get user id from api gateway
//use for all routes
router.use(authUserReq);



router.post('/create-post', createPost);
router.get('/allposts', getAllPost); 
router.get("/post/:id", getPost);
router.delete("/post/:id", deletPostbyId);
router.delete("/delete-posts", deletePosts);


module.exports = router;
