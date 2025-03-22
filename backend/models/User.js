const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, // Full Name field
  email: { type: String, unique: true, required: true }, // Email field
  phoneNumber: { type: String }, // Phone Number field
  password: { type: String, required: true }, // Password field
  role: {
    type: String,
    enum: ["client", "craftsman", "admin"],
    default: "client",
  }, // User role selection
  skills: [
    {
      type: String,
      enum: [
        "No skills",
        "Woodworking",
        "Metalworking",
        "Painting",
        "Plumbing",
        "Electrical Work",
      ],
    },
  ], // Multi-select skills
  bio: { type: String }, // Bio field
  location: { type: String }, // Location field
  newsletterSubscribed: { type: Boolean, default: false }, // Checkbox for newsletter

  // ✅ Add these two lines below:
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },

  verificationCodeSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now }, // Timestamp for account creation
});

module.exports = mongoose.model("User", UserSchema);
