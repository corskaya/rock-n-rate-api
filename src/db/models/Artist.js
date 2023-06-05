const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageURL: {
      type: String,
    },
    rating: {
      type: Number,
    },
    about: {
      type: String,
    },
    genre: {
      type: String,
      required: true,
    },
    subGenres: {
      type: [String],
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Artist = mongoose.model("Artist", ArtistSchema);

module.exports = Artist;
