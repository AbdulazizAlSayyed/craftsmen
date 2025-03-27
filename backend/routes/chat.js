// routes/chat.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

// GET messages by conversation ID
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new message
router.post("/messages", async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();

    await Conversation.findByIdAndUpdate(req.body.conversationId, {
      updatedAt: new Date(),
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all conversations for a user with populated participant info
router.get("/conversations/:userId", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.params.userId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants")
      .lean();

    for (let conv of conversations) {
      const lastMessage = await Message.findOne({
        conversationId: conv._id,
      })
        .sort({ createdAt: -1 })
        .lean();
      conv.lastMessage = lastMessage?.text || null;
      conv.lastTime = lastMessage?.createdAt || conv.updatedAt;
    }

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
