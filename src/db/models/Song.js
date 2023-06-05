const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const SongSchema = new mongoose.Schema(
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
    albumRefObjectId: {
      type: ObjectId,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Song = mongoose.model("Song", SongSchema);

module.exports = Song;
