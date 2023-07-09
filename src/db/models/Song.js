const mongoose = require("mongoose");
const genres = require("../../constants/genres");
const { ObjectId } = mongoose.Schema.Types;

const RatingSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
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

const SongSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    genres: {
      type: [String],
      required: true,
      enum: genres,
    },
    artistRefObjectId: {
      type: ObjectId,
      required: true,
    },
    albumRefObjectId: {
      type: ObjectId,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    ratings: [RatingSchema],
  },
  { timestamps: true }
);

ArtistSchema.methods.updateRating = function () {
  if (this.ratings.length === 0) {
    this.rating = 0;
  } else {
    const sum = this.ratings.reduce(
      (total, rating) => total + rating.rating,
      0
    );
    this.rating = sum / this.ratings.length;
  }
};

const Song = mongoose.model("Song", SongSchema);

module.exports = Song;
