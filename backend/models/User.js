const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["client", "craftsman", "admin"],
    default: "client",
  },
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
  ],
  bio: { type: String },
  location: { type: String },
  newsletterSubscribed: { type: Boolean, default: false },

  // ✅ Add this line:
  profileImage: { type: String, default: "" },

  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeSentAt: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("User", UserSchema);
