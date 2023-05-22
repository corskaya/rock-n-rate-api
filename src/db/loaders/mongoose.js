const mongoose = require("mongoose");

const connectionString = process.env.MONGODB_URL;

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.once("open", () => {
  console.log("Connected to MongoDB successfully!");
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
});
