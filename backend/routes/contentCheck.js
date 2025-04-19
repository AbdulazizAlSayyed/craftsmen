const express = require("express");
const router = express.Router();
const checkContent = require("../utils/contentUtils"); // Now importing the function directly

router.post("/check-content", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const result = await checkContent(text);
    res.json(result);
  } catch (error) {
    console.error("Content check error:", error);
    res.status(500).json({
      error: "Failed to check content",
      details: error.message,
    });
  }
});

module.exports = router;
