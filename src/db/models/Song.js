const mongoose = require("mongoose");
const genres = require("../../constants/genres");
const { ObjectId } = mongoose.Schema.Types;

const SongSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    about: {
      type: String,
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
    artistRefName: {
      type: String,
      required: true,
    },
    albumRefObjectId: {
      type: ObjectId,
      required: true,
    },
    albumRefName: {
      type: String,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    image: {
      type: String,
    },
    addedByUserId: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

SongSchema.methods.updateRating = function (ratings) {
  this.ratingCount = ratings.length;
  if (ratings.length === 0) {
    this.rating = 0;
  } else {
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    this.rating = sum / ratings.length;
  }
};

const Song = mongoose.model("Song", SongSchema);

module.exports = Song;
