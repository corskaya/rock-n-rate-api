const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");
const cors = require("cors");
const setLang = require("./middlewares/setLang");
require("dotenv").config();
require("./db/loaders/mongoose");

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.use(setLang);
app.use("/", routes);
app.use("/api/v1", routes);

if (process.env.PORT) {
  app.listen(process.env.PORT, () => {
    console.log(`Rock'n Rate API Started up at port ${process.env.PORT}`);
  });
} else {
  app.listen(3000, () => {
    console.log(`Rock'n Rate API Started up at port 3000`);
  });
}

module.exports = app;
