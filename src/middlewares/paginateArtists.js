const moment = require("moment");

const paginateArtists = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      searchTerm = "",
      genre = "All",
      rating = 0,
      year = "All",
      orderBy = "Latest",
    } = req.query;

    page = Number(page) - 1;
    limit = Number(limit);
    rating = Number(rating);
    gteYear = year === "All" ? 1900 : Number(year.split("-")[0]);
    lteYear = year === "All" ? moment().year() : Number(year.split("-")[1]);

    const query = {
      name: { $regex: searchTerm, $options: "i" },
      foundationYear: { $gte: gteYear, $lte: lteYear },
      rating: { $gte: rating },
    };
    if (genre !== "All") query.genres = { $in: [genre] };

    let sortBy = "createdAt";
    if (orderBy === "Year") sortBy = "foundationYear";
    if (orderBy === "Rating") sortBy = "rating";
    if (orderBy === "Popularity") sortBy = "ratingCount";
    let sortOrder = orderBy === "Oldest" ? 1 : -1;

    req.find = query;
    req.sort = { [sortBy]: sortOrder };
    req.skip = page * limit;
    req.limit = limit;

    next();
  } catch (e) {
    res.status(400).json({
      status: "Failed",
      message: e.message,
    });
  }
};

module.exports = paginateArtists;
