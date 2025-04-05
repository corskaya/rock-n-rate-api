const setLang = async (req, res, next) => {
  const langHeader = req.query.lang || req.headers["x-lang"];
  req.lang = (langHeader || "en").toLowerCase();
  next();
};

module.exports = setLang;
