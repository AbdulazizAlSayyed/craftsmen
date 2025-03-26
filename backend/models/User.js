const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Skill name (e.g., Woodworking, Plumbing)
  rank: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    default: "Beginner",
  },
  xpPoints: { type: Number, default: 0 }, // Experience points for this skill
  rating: { type: Number, default: 0.0 }, // Average rating for this skill
  numberOfJobs: { type: Number, default: 0 }, // Jobs completed under this skill
  numberOfRatedJobs: { type: Number, default: 0 }, // Jobs that received a rating
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
  skills: [skillSchema], // Each skill has its own rank, experience, and rating
  bio: { type: String },
  age: { type: Number, default: 0 }, // here should change the default value to another value talk with tala abiut the new value
  location: { type: String },
  newsletterSubscribed: { type: Boolean, default: false },
  profileImage: { type: String, default: "" },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeSentAt: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
