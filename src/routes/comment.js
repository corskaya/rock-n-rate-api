const router = require("express").Router();
const Topic = require("../constants/topic");
const Comment = require("../db/models/Comment");
const User = require("../db/models/User");
const Artist = require("../db/models/Artist");
const Album = require("../db/models/Album");
const Song = require("../db/models/Song");
const authenticate = require("../middlewares/authenticate");
const identifyUser = require("../middlewares/identifyUser");

router.get("/:topic/:topicSlug", async (req, res) => {
  try {
    const topicSlug = req.params.topicSlug;
    let topic = req.params.topic;
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);

    const comments = await Comment.find({ topic, topicSlug }).sort({
      createdAt: -1,
    }).lean();

    const userIds = comments.map((comment) => comment.userId);
    const users = await User.find({ _id: { $in: userIds } });

    const mappedComments = comments.map((comment) => {
      const user = users.find((user) => user._id.toString() === comment.userId.toString());

      return {
        ...comment,
        username: user?.username,
        avatar: user?.avatar,
      };
    });

    res.status(200).send({ comments: mappedComments });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/", identifyUser, authenticate, async (req, res) => {
  try {
    const { topic, topicSlug, content } = req.body;
    let topicData;

    if (topic === Topic.Artist) {
      topicData = await Artist.findOne({ slug: topicSlug });
    } else if (topic === Topic.Album) {
      topicData = await Album.findOne({ slug: topicSlug });
    } else if (topic === Topic.Song) {
      topicData = await Song.findOne({ slug: topicSlug });
    }

    if (!content) {
      throw new Error("No comment written");
    }

    const comment = new Comment({
      topic,
      topicId: topicData._id,
      topicSlug,
      content,
      userId: req.user._id,
    });
    await comment.save();

    const user = await User.findOne({ _id: req.user._id });
    const mappedComment = {
      ...comment._doc,
      username: user.username,
      avatar: user.avatar,
    };

    res.status(201).send(mappedComment);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.delete("/:id", identifyUser, authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findOne({ _id: commentId, userId: req.user._id });

    if (!comment) {
      throw new Error("Comment not found");
    }

    const removedComment = await Comment.findByIdAndDelete(commentId);

    res.status(200).send(removedComment);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.patch("/like/:id", identifyUser, authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      throw new Error("Comment not found");
    }

    comment.likes = [...comment.likes, userId];
    comment.likeCount = comment.likes.length;
    await comment.save();

    res.status(200).send({ comment });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.patch("/unlike/:id", identifyUser, authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      throw new Error("Comment not found");
    }

    comment.likes = comment.likes.filter((like) => {
      return like.toString() !== userId.toString();
    });
    comment.likeCount = comment.likes.length;
    await comment.save();

    res.status(200).send({ comment });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = { router };
