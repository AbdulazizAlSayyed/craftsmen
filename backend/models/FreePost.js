const mongoose = require("mongoose");

const freePostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  prompt: { type: String, required: true }, // Client's message
  aiResponse: { type: String }, // AI-generated content
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FreePost", freePostSchema);
