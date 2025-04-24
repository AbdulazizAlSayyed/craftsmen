const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Skill name (e.g., Woodworking)
  rank: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    default: "Beginner",
  },
  xpPoints: { type: Number, default: 0 },
  rating: { type: Number, default: 0.0 },
  numberOfJobs: { type: Number, default: 0 },
  numberOfRatedJobs: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["client", "craftsman", "admin"],
    default: "client",
  },
  status: {
    type: String,
    enum: ["Active", "Banned", "Spam"],
    default: "Active",
  },

  skills: [skillSchema],
  bio: { type: String },
  age: { type: Number, default: 18 }, // (Update if needed)
  location: { type: String },

  newsletterSubscribed: { type: Boolean, default: false },
  profileImage: { type: String, default: "" },

  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeSentAt: { type: Date },

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  lastLogin: { type: Date, default: null },
  blockForMissingRating: { type: Boolean, default: false }, // ✅ Step 1: Restriction flag
  darkMode: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
