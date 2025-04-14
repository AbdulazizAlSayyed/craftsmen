const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const User = require("../models/User"); // <-- Import User model

// GET all categories with craftsman count
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().lean();

    const counts = await User.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills.name", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => (countMap[c._id] = c.count));

    categories.forEach((cat) => {
      cat.followerCount = countMap[cat.name] || 0;
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// CREATE a new category
router.post("/", async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ error: "Category already exists" });

    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// UPDATE a category
router.put("/:id", async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE a category
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Category not found" });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
