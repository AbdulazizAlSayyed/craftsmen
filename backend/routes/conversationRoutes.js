const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/message");

router.get("/:userId", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.params.userId] },
    })

      .populate("participants", "fullName profileImage") // for sidebar
      .sort({ updatedAt: -1 });

    // Get latest message preview for each conversation
    const withPreviews = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          ...conv.toObject(),
          lastMessage: lastMsg?.text || "",
          lastTime: lastMsg?.createdAt || conv.updatedAt,
        };
      })
    );

    res.json(withPreviews);
  } catch (err) {
    console.error("❌ Conversation fetch error:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

module.exports = router;
