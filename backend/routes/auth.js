const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

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

    // Check if email exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Create user with plain text password (⚠️ Insecure)
    user = new User({
      fullName,
      email,
      phoneNumber,
      password, // no hashing
      role,
      skills,
      bio,
      location,
      newsletterSubscribed,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ User Login
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    console.log("Received login request:", { emailOrUsername, password });

    // 🔍 Check if user exists by email OR fullName
    let user = await User.findOne({
      $or: [{ email: emailOrUsername }, { fullName: emailOrUsername }],
    });

    console.log("User found in DB:", user); // 🔍 Debugging

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (User not found)" });
    }

    // Plain text password comparison (⚠️ Insecure)
    console.log("Entered password:", password);
    console.log("Stored password:", user.password);
    if (user.password !== password) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (Wrong password)" });
    }

    /* Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    ); */

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
