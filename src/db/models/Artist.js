const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    image: {
      type: String,
    },
    cloudinaryId: {
      type: String,
    },
  },
  { timestamps: true }
);

const Artist = mongoose.model("Artist", ArtistSchema);

module.exports = Artist;
