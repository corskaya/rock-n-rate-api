const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const AlbumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
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
  },
  { timestamps: true }
);

const Album = mongoose.model("Album", AlbumSchema);

module.exports = Album;
