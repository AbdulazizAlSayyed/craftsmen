const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// PATCH: Update user role or status
router.patch("/:id", async (req, res) => {
  try {
    const { role, status } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { ...(role && { role }), ...(status && { status }) },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update user" });
  }
});
// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
