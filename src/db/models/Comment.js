const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const Topic = Object.freeze({
  Artist: "Artist",
  Album: "Album",
  Song: "Song",
});

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    likedBy: {
      type: [ObjectId],
    },
    userRefObjectId: {
      type: ObjectId,
      required: true,
    },
    topic: {
      type: String,
      enum: Object.values(Topic),
    },
    topicRefObjectId: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
