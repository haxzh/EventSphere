const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadImage } = require("../controllers/uploadController");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "public", "uploads");
const fs = require("fs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("image"), uploadImage);

module.exports = router;
