const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const Topic = require("../../constants/topic");

const CommentSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      enum: Object.values(Topic),
    },
    topicId: {
      type: ObjectId,
      required: true,
    },
    topicSlug: {
      type: String,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    likes: {
      type: [ObjectId],
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
