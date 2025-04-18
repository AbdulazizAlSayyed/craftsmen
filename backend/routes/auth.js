const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const crypto = require("crypto");

// for chat

require("dotenv").config();

const router = express.Router();

// ✅ Email transporter setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ User Registration (Sign Up)
router.post("/signup", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      role,
      skills,
      bio,
      location,
      newsletterSubscribed,
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create user
    user = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      skills,
      bio,
      location,
      newsletterSubscribed,
      verificationCode,
      verificationCodeSentAt: new Date(),

      isVerified: false,
    });

    await user.save();

    // Send verification email
    console.log("✅ Verification Code for user:", verificationCode); // <-- Add this here

    // Send verification email
    await transporter.sendMail({
      from: `"Craftsmen App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Craftsmen Account",
      text: `Your verification code is: ${verificationCode}`,
    });

    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ Verify Email
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "Already verified" });

    if (user.verificationCode !== code)
      return res
        .status(400)
        .json({ message: "Verification failed. Try again." });

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ Resend Verification Code
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found for email:", email);
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      console.log("✅ Email already verified for:", email);
      return res.status(400).json({ message: "Email already verified" });
    }

    const now = Date.now();
    const lastSent = user.verificationCodeSentAt
      ? new Date(user.verificationCodeSentAt).getTime()
      : 0;

    const cooldown = 60 * 1000; // 1 minute

    if (now - lastSent < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
      console.log(`⏳ Cooldown active. Try again in ${wait}s for:`, email);
      return res
        .status(429)
        .json({ message: `Please wait ${wait}s before resending.` });
    }

    // Generate new code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationCodeSentAt = new Date();
    await user.save();

    console.log("📧 New verification code:", newCode, "for", email);

    // Send verification email
    await transporter.sendMail({
      from: `"Craftsmen App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your New Verification Code",
      text: `Your new verification code is: ${newCode}`,
      html: `<p>Hello,</p>
             <p>Your new verification code is: <strong>${newCode}</strong></p>
             <p>If you didn't request this, you can ignore this email.</p>
             <p>– Craftsmen Team</p>`,
    });

    res.json({ message: "Verification code resent. Please check your email." });
  } catch (err) {
    console.error("❌ Resend verification error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

//forgot-password

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No user with that email." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    const resetLink = `http://localhost:5001/Reset-your-password.html?token=${resetToken}&email=${email}`;

    await transporter.sendMail({
      from: `"Craftsmen App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Reset link sent. Please check your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//reset-password
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  console.log("🔐 Reset password request received:");
  console.log("Email:", email);
  console.log("Token:", token);
  console.log("New Password:", newPassword);

  try {
    const user = await User.findOne({ email, resetPasswordToken: token });

    if (!user || user.resetPasswordExpires < Date.now()) {
      console.log("⛔ Token expired or user not found.");
      return res.status(400).json({ message: "Token expired or invalid" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("✅ Password reset successful");
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { fullName: emailOrUsername }],
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified && user.fullName !== "Admin")
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    if (user.status === "Banned") {
      return res
        .status(403)
        .json({ message: "Your account is banned. Please contact support." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
