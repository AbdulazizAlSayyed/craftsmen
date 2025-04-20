const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String },
  message: { type: String },
  status: { type: String, default: "Pending Review" },
  adminNotes: { type: String },
  reportedDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);
