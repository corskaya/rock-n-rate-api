const mongoose = require("mongoose");
const genres = require("../../constants/genres");
const { ObjectId } = mongoose.Schema.Types;
const slugify = require("../../utils/slugify");

const AlbumSchema = new mongoose.Schema(
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
    artistRefSlug: {
      type: String,
      required: true,
    },
    artistRefName: {
      type: String,
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
    addedByUserId: {
      type: ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

AlbumSchema.methods.toJSON = function () {
  const album = this;
  const albumObject = album.toObject();
  albumObject.rating = +albumObject.rating.toFixed(1);
  return albumObject;
};

AlbumSchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    let slug = slugify(this.name);
    let uniqueSlug = slug;
    let count = 1;

    while (await mongoose.models.Album.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${count}`;
      count++;
    }

    this.slug = uniqueSlug;
  }
  next();
});

AlbumSchema.methods.updateRating = function (ratings) {
  this.ratingCount = ratings.length;
  if (ratings.length === 0) {
    this.rating = 0;
  } else {
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    this.rating = sum / ratings.length;
  }
};

const Album = mongoose.model("Album", AlbumSchema);

module.exports = Album;
