const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  milestonesEnabled: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["open", "in progress", "completed", "cancelled"],
    default: "open",
  },
  skillsRequired: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  craftsmanId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Craftsman who completed the job

  ratings: { type: Number, default: 0 },
  jobRank: {
    type: String,
    enum: ["Beginner", "Advanced", "Expert"],
    default: "Beginner", // Default rank could be "Beginner"
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
