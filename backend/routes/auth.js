const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
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
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "Email already verified" });

    const now = Date.now();
    const lastSent = user.verificationSentAt
      ? new Date(user.verificationSentAt).getTime()
      : 0;
    const cooldown = 60 * 1000; // 1 minute cooldown

    if (now - lastSent < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
      return res
        .status(429)
        .json({ message: `Please wait ${wait}s before resending.` });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationSentAt = new Date();
    await user.save();

    console.log("📧 New code:", newCode);

    await transporter.sendMail({
      from: `"Craftsmen App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your New Verification Code",
      text: `Your new verification code is: ${newCode}`,
    });

    res.json({ message: "Verification code resent. Please check your email." });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ message: "Server Error", error: err });
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

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
