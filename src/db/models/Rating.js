const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const Topic = Object.freeze({
  Artist: "Artist",
  Album: "Album",
  Song: "Song",
});

const RatingSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      enum: Object.values(Topic),
      require: true,
    },
    topicId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
  },
  { timestamps: true }
);

const Rating = mongoose.model("Rating", RatingSchema);

module.exports = Rating;
module.exports.Topic = Topic;
