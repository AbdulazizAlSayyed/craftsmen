const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Import User model
const upload = require("../middleware/upload"); // ✅ Multer middleware

// GET all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ POST route to upload profile image
router.post("/upload-profile", upload.single("profileImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
