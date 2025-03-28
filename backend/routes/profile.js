const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Job = require("../models/Job");
const upload = require("../middleware/upload");

// ✅ Fetch craftsman profile based on skill
// ✅ Route to fetch all skills of a craftsman
router.get("/:craftsmanId/all-skills", async (req, res) => {
  try {
    const { craftsmanId } = req.params;

    // Find the craftsman by ID
    const user = await User.findById(craftsmanId);
    if (!user || user.role !== "craftsman") {
      return res.status(404).json({ message: "Craftsman not found" });
    }

    res.json({ skills: user.skills });
  } catch (err) {
    console.error("Error fetching skills:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:craftsmanId/:skillName", async (req, res) => {
  try {
    const { craftsmanId, skillName } = req.params;

    // Find the craftsman by ID
    const user = await User.findById(craftsmanId);
    if (!user || user.role !== "craftsman") {
      return res.status(404).json({ message: "Craftsman not found" });
    }

    // Find the skill from their skills array
    const skill = user.skills.find(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (!skill) {
      return res
        .status(404)
        .json({ message: `Skill '${skillName}' not found` });
    }

    // Fetch only jobs related to the selected skill
    const jobs = await Job.find({
      userId: craftsmanId,
      categories: { $in: [skillName] }, // Match any job with this skill
    });

    res.json({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage || "default.png",

      bio: user.bio,
      location: user.location,
      skill: skill, // Only return selected skill's data
      jobs: jobs, // Only return jobs related to this skill
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage || "default.png",
      bio: user.bio || "No bio available",
      location: user.location || "Location not provided",
      skills: user.skills || [],
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post(
  "/:craftsmanId/image",
  upload.single("profileImage"),
  async (req, res) => {
    const { craftsmanId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    try {
      await User.findByIdAndUpdate(craftsmanId, { profileImage: imageUrl });
      res.json({ message: "Image uploaded successfully.", imageUrl });
    } catch (err) {
      console.error("❌ Error updating user profile:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.put("/:craftsmanId", async (req, res) => {
  const { craftsmanId } = req.params;
  const updates = req.body;

  try {
    const user = await User.findByIdAndUpdate(craftsmanId, updates, {
      new: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
