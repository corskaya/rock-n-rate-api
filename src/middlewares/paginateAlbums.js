const moment = require("moment");

const paginateAlbums = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 16,
      searchTerm = "",
      genre = "All",
      rating = 0,
      year = "All",
      orderBy = "Latest",
    } = req.query;

    page = Number(page) - 1;
    limit = Number(limit);
    rating = Number(rating);
    gteYear = year === "All"
      ? moment("1900-01-01")
      : moment(`${year.split("-")[0]}-01-01`);
    lteYear = year === "All" 
      ? moment() 
      : moment(`${year.split("-")[1]}-01-01`).endOf("year");

    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { artistRefName: { $regex: searchTerm, $options: "i" } },
      ],
      releaseDate: { $gte: gteYear, $lte: lteYear },
      rating: { $gte: rating },
    };
    if (genre !== "All") query.genres = { $in: [genre] };

    let sortBy = "createdAt";
    if (orderBy === "Year") sortBy = "releaseDate";
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

module.exports = paginateAlbums;
