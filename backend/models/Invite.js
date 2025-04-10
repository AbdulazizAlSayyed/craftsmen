const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  craftsmanId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invite", inviteSchema);
