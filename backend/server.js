const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables
const jobRoutes = require("./routes/jobRoutes"); // Import the job routes

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Allow frontend to access API
app.use(express.static(path.join(__dirname, "..", "frontend"))); // Serve frontend files

// ✅ MongoDB Connection (Fixed: Removed Deprecated Options)
mongoose
  .connect(process.env.MONGODB_URI) // ✅ No deprecated options
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ API Routes
app.use("/api/auth", require("./routes/auth")); // Authentication Routes
app.use("/api/users", require("./routes/userRoutes")); // User Management Routes
app.use("/api/jobs", require("./routes/jobRoutes")); // Connect job routes

// ✅ Serve Frontend Pages
const pages = [
  "signup.html",
  "log-in.html",
  "dashborad.html",
  "Explore.html",
  "profile.html",
  "Profile2.html",
  "job.html",
  "Notification.html",
  "chat.html",
  "myjob.html",
  "new.html",
  "proposal.html",
  "proposalFinal.html",
  "post.html",
  "Reset-your-password.html",
  "Setting.html",
  "t1.html",
  "Forgot-your-password.html",
  "verification-email.html",
];

pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "pages", page));
  });
});

// ✅ Default Route (Serve Home Page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "guest.html"));
});

// ✅ Handle 404 Errors
app.use((req, res) => {
  res.status(404).send("Page not found!");
});

// ✅ Start the Server (MUST BE LAST)
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log("🔍 MongoDB URI from .env:", process.env.MONGODB_URI);
});
