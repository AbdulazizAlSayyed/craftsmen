const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  craftsmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coverLetter: { type: String },
  bidAmount: { type: Number }, // Optional if you're implementing bidding
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  appliedAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("Application", applicationSchema);
