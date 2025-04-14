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

// ✅ GET users by skill category
router.get("/by-skill", async (req, res) => {
  const category = req.query.category;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    const users = await User.find({
      role: "craftsman", // Only get craftsmen
      "skills.name": category, // Match skill name
    }).select("_id fullName skills profileImage");

    const filteredUsers = users.map((user) => {
      const matchedSkill = user.skills.find((skill) => skill.name === category);
      return {
        _id: user._id, // ✅ this was missing
        name: user.fullName,
        rating: matchedSkill?.rating?.toFixed(1) || "N/A",
        profileImage: user.profileImage || "/uploads/default.png",
      };
    });

    res.json(filteredUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users by skill" });
  }
});
module.exports = router;
