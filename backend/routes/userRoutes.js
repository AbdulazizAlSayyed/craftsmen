const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Import User model

// GET all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
