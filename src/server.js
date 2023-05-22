const express = require("express");
const routes = require("./routes");
const cors = require("cors");
const app = express();
require("dotenv").config();
require("./db/loaders/mongoose");

app.use(cors());
app.use("/", routes);
app.use("/api/v1", routes);

if (process.env.PORT) {
  app.listen(process.env.PORT, () => {
    console.log(`Music Ratings API Started up at port ${process.env.PORT}`);
  });
} else {
  app.listen(3000, () => {
    console.log(`Music Ratings API Started up at port 3000`);
  });
}
