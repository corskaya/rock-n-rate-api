const mongoose = require("mongoose");
const genres = require("../../constants/genres");
const countries = require("../../constants/countries");
const { ObjectId } = mongoose.Schema.Types;

const SocialSchema = new mongoose.Schema({
  spotify: {
    type: String,
  },
  youtube: {
    type: String,
  },
  instagram: {
    type: String,
  },
});

const ArtistSchema = new mongoose.Schema(
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
    foundationYear: {
      type: Number,
    },
    country: {
      type: String,
      required: true,
      enum: countries,
    },
    addedByUserId: {
      type: ObjectId,
      required: true,
    },
    social: SocialSchema,
  },
  {timestamps: true}
);

ArtistSchema.methods.updateRating = function (ratings) {
  this.ratingCount = ratings.length;
  if (ratings.length === 0) {
    this.rating = 0;
  } else {
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    this.rating = sum / ratings.length;
  }
};

const Artist = mongoose.model("Artist", ArtistSchema);

module.exports = Artist;
