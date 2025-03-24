const express = require("express");
const router = express.Router();
const Message = require("../models/message");

// GET messages by conversation ID
router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    app.use((req, res) => {
      res.status(404).send("Page not found!");
    });
  }
});

module.exports = router;
