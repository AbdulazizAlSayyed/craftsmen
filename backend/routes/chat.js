// routes/chat.js
const express = require("express");
const router = express.Router();
const Message = require("../models/message");
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

// Mark messages as read
router.put("/messages/mark-read/:conversationId/:userId", async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        receiver: req.params.userId,
        read: false,
      },
      { $set: { read: true } }
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new message
router.post("/messages", async (req, res) => {
  try {
    const message = new Message({ ...req.body, read: false });
    await message.save();

    // Update conversation time
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

// POST to start a new conversation and send initial message
router.post("/conversations/start", async (req, res) => {
  const { senderId, receiverId } = req.body;
  const mongoose = require("mongoose");

  if (
    !mongoose.Types.ObjectId.isValid(senderId) ||
    !mongoose.Types.ObjectId.isValid(receiverId)
  ) {
    return res.status(400).json({ error: "Invalid sender or receiver ID." });
  }

  try {
    // Check if a conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
      await conversation.save();
    }

    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      text: "hello",
      read: false,
    });

    await message.save();

    res.status(200).json({
      message: "Conversation started and message sent.",
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("❌ Failed to start conversation:", error);
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

module.exports = router;
