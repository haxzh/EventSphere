const path = require("path");
const fs = require("fs");

// Simple upload controller: expects multer to populate req.file
const uploadImage = (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ msg: "no-file" });

        // Build a public URL for the uploaded file
        const fileName = req.file.filename;
        const apiHost = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

        // Expose via server static `/uploads` path
        const publicUrl = `${apiHost}/uploads/${fileName}`;

        return res.status(200).send({ url: publicUrl });
    } catch (err) {
        console.error("upload error:", err);
        return res.status(500).send({ msg: "upload-failed" });
    }
};

module.exports = { uploadImage };
