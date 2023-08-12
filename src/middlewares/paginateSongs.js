const moment = require("moment");

const paginateSongs = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 30,
      searchTerm = "",
      genre = "All",
      rating = 0,
      year = "All",
      orderBy = "Latest",
    } = req.query;

    page = Number(page) - 1;
    limit = Number(limit);
    rating = Number(rating);
    gteYear =
      year === "All"
        ? moment("1900-01-01")
        : moment(Number(`${year.split("-")[0]}-01-01`));
    lteYear =
      year === "All" ? moment() : moment(Number(`${year.split("-")[1]}-01-01`));

    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { albumRefName: { $regex: searchTerm, $options: "i" } },
        { artistRefName: { $regex: searchTerm, $options: "i" } },
      ],
      releaseDate: { $gte: gteYear, $lte: lteYear },
      rating: { $gte: rating },
    };
    if (genre !== "All") query.genres = { $in: [genre] };

    let sortBy = "createdAt";
    if (orderBy === "Year") sortBy = "releaseDate";
    if (orderBy === "Rating") sortBy = "rating";
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

module.exports = paginateSongs;
