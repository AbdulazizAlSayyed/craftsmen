const express = require("express");
const router = express.Router();
const Craftsman = require("../models/User"); // Adjust the path if needed
const bcrypt = require("bcrypt");

// Update Name
router.put("/:craftsmanId/name", async (req, res) => {
  try {
    const { name } = req.body;
    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, {
      fullName: name,
    });
    res.json({ message: "Name updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update name" });
  }
});

// Update Username
router.put("/:craftsmanId/username", async (req, res) => {
  try {
    const { username } = req.body;
    const existing = await Craftsman.findOne({ username });
    if (existing)
      return res.status(409).json({ error: "Username already taken" });

    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, { username });
    res.json({ message: "Username updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update username" });
  }
});

// Update Dark Mode
// Update Dark Mode - Add proper validation
// GET dark mode setting
router.get("/:craftsmanId/dark-mode", async (req, res) => {
  try {
    const user = await Craftsman.findById(req.params.craftsmanId).select(
      "darkMode -_id"
    ); // Only return darkMode field

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      darkMode: user.darkMode || false, // Default to false if undefined
    });
  } catch (err) {
    console.error("Dark mode fetch error:", err);
    res.status(500).json({ error: "Failed to fetch dark mode setting" });
  }
});

// PUT (update) dark mode setting
router.put("/:craftsmanId/dark-mode", async (req, res) => {
  try {
    const { enabled } = req.body;

    // Validate input
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid dark mode value" });
    }

    const updatedUser = await Craftsman.findByIdAndUpdate(
      req.params.craftsmanId,
      { darkMode: enabled },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Dark mode updated",
      darkMode: updatedUser.darkMode,
    });
  } catch (err) {
    console.error("Dark mode update error:", err);
    res.status(500).json({ error: "Failed to update dark mode" });
  }
});

// Update Email Notifications
router.put("/:craftsmanId/email-notifications", async (req, res) => {
  try {
    const { enabled } = req.body;
    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, {
      emailNotifications: enabled,
    });
    res.json({ message: "Email notification setting updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update email notifications" });
  }
});

// Update Bio
router.put("/:craftsmanId/bio", async (req, res) => {
  try {
    const { bio } = req.body;
    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, { bio });
    res.json({ message: "Bio updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update bio" });
  }
});

// Update Location
router.put("/:craftsmanId/location", async (req, res) => {
  try {
    const { location } = req.body;
    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, { location });
    res.json({ message: "Location updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Update Email
router.put("/:craftsmanId/email", async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await Craftsman.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, { email });
    res.json({ message: "Email updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update email" });
  }
});

// Update Password
router.put("/:craftsmanId/password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Craftsman.findByIdAndUpdate(req.params.craftsmanId, {
      password: hashedPassword,
    });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

module.exports = router;
