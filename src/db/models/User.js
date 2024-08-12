const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Role = Object.freeze({
  Admin: "Admin",
  Moderator: "Moderator",
  User: "User",
});

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.User,
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    activationCode: {
      type: String,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    cloudinaryId: {
      type: String,
    },
    about: {
      type: String,
    },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.isDeleted;
  return userObject;
};

UserSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  return token;
};

UserSchema.statics.findByCredentials = async (usernameOrEmail, password) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailPattern.test(usernameOrEmail);

  const user = isEmail
    ? await User.findOne({ email: usernameOrEmail })
    : await User.findOne({ username: usernameOrEmail });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

  return user;
};

UserSchema.pre("save", async function (next) {
  const user = this;

  if (user.isNew) {
    user.activationCode = generateActivationCode();
  }
  
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

function generateActivationCode(length = 6) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const User = mongoose.model("User", UserSchema);

module.exports = User;
