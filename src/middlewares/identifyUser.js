const path = require("path");
const jwt = require("jsonwebtoken");
const User = require(path.join(__dirname, "../db/models/User"));

const identifyUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
    });

    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (e) {
    next();
  }
};

module.exports = identifyUser;
