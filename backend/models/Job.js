const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  budget: { type: Number, required: true }, // Changed from payment to budget
  deadline: { type: String, required: true }, // Changed to String to match "1 week" format
  categories: [{ type: String }], // Added for job tags like "Web Development", "ReactJS"
  milestonesEnabled: { type: Boolean, default: false }, // New field for milestone payments checkbox
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
