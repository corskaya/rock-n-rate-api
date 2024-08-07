const router = require("express").Router();
const Comment = require("../db/models/Comment");
const authenticate = require("../middlewares/authenticate");
const identifyUser = require("../middlewares/identifyUser");

router.get("/:topic/:topicId", async (req, res) => {
  try {
    const topicId = req.params.topicId;
    let topic = req.params.topic;
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);

    const comments = await Comment.find({ topic, topicId }).sort({
      createdAt: -1,
    });

    res.status(200).send({ comments });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

router.post("/", identifyUser, authenticate, async (req, res) => {
  try {
    const { topic, topicId, content } = req.body;

    const comment = new Comment({
      topic,
      topicId,
      content,
      userId: req.user._id,
    });
    await comment.save();

    res.status(201).send(comment);
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
      throw new Error('Comment not found.');
    }

    await Comment.deleteOne({ _id: comment._id });

    res.status(200).send({ message: 'Comment removed successfully.' });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

module.exports = { router };
