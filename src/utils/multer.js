const path = require("path");
const multer = require("multer");

// multer config
const upload = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("Accepted file extensions are jpg, jpeg ve png."), false);
      return;
    }
    cb(null, true);
  },
});

module.exports = upload;
