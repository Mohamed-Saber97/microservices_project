const logger = require("../utils/logger");
const Post = require("../models/Post");
const { validatePost } = require("../utils/validate");
const { publishEvent } = require("../utils/rabbitmq");
//create post

// todo

// async function invalidatePostCache(req, input) {
//   const cachedKey = `post:${input}`;
//   await req.redisClient.del(cachedKey);

//   const keys = await req.redisClient.keys("posts:*");
//   if (keys.length > 0) {
//     await req.redisClient.del(keys);
//   }
// }

const createPost = async (req, res) => {
  try {
    const { error } = validatePost(req.body);
    if (error) {
      logger?.error?.("content of post not valid", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const addedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await addedPost.save();
    // publish for search service
    await publishEvent("post.created", {
      postId: addedPost._id.toString(),
      userId: addedPost.user.toString(),
      content: addedPost.content,
      createdAt: addedPost.createdAt,
    });
    
    //await invalidatePostCache(req, addedPost._id.toString());
    logger.info("post created successfully", addedPost);
    res.status(201).json({
      success: true,
      message: "post created successfully",
    });
  } catch (error) {
    logger.error("error while craeting a post", error);
    res.status(500).json({
      success: false,
      message: "error while craeting a post", 
    });
  }
};

//getall post

const getAllPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startindex = (page - 1) * limit;
    //redis
    const caheKey = `posts:${page}:${limit}`;
    const cahedPosts = await req.redisClient.get(caheKey);
    if (cahedPosts) {
      return res.json(JSON.parse(cahedPosts));
    }

    const allPosts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startindex)
      .limit(limit);
    const totalPosts = await Post.countDocuments();
    const result = {
      allPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
    //save posts in redis cache
    await req.redisClient.setex(caheKey, 300, JSON.stringify(result));
  } catch (error) {
    logger.error("error while getting all posts", error);
    res.status(500).json({
      success: false,
      message: "error while getting a post",
    });
  }
};

//get post by id

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const postById = await Post.findById(postId);
    if (!postById) {
      logger.error("the id is not exist ");
      return res.status(404).json({
        success: false,
        message: "the id is not exist",
      });
    }

    res.status(200).json({
      success: true,
      data: postById,
    });
  } catch (error) {
    logger.error("error while get  a post", error);
    res.status(500).json({
      success: false,
      message: "error while craeting a post",
    });
  }
};

// update post

//delete post

const deletPostbyId = async (req, res) => {
  try {
    const postId =  req.params.id;
    const postById = await Post.findByIdAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!postById) {
      logger.error("Post Not found to delete it");
      return res.status(404).json({
        success: false,
        message: "Post Not found to delete it",
      });
    }
    //publish post delete method
    //routing key is a identifier
    await publishEvent("post.deleted", {
      postId: postById._id.toString(),
      userId: req.user.userId,
      mediaIds: postById.mediaIds,
    });
    
    res.status(200).json({
      success: true,
      message: "post deleted successfully",
      data: postById,
    });
  } catch (error) {
    logger.error("error while delete a post", error);
    res.status(500).json({
      success: false,
      message: "error while delete a post",
    });
  }
};

//deleet all posts
const deletePosts = async (req, res) => {
  try {
    await Post.deleteMany({});
    logger.info("all posts are deleteed");
    res.status(200).json({
      success: true,
      message: "all posts are deleteed",
    });
  } catch (error) {
    logger.error("error while delete all posts", error);
    res.status(500).json({
      success: false,
      message: "error while deleteing all post",
    });
  }
};

module.exports = {
  createPost,
  getAllPost,
  getPost,
  deletPostbyId,
  deletePosts,
};
