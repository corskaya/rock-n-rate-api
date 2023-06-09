const mongoose = require("mongoose");
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

const AlbumSchema = new mongoose.Schema(
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
    genre: {
      type: String,
      required: true,
    },
    subGenres: {
      type: [String],
    },
    artistRefObjectId: {
      type: ObjectId,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    isComplete: {
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
    cloudinaryId: {
      type: String,
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

const Album = mongoose.model("Album", AlbumSchema);

module.exports = Album;
