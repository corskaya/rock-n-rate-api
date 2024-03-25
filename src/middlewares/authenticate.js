const authenticate = async (req, res, next) => {
  try {
    if (!req.user._id) {
      throw new Error("Please login");
    }

    next();
  } catch (e) {
    res.status(401).json({
      status: "Failed",
      message: e.message,
    });
  }
};

module.exports = authenticate;
