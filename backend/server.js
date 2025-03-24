const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");

const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/message"); // add at top

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware (first!)
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(express.static(path.join(__dirname, "..", "frontend"))); // Serve frontend

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messages"));

app.use("/api/auth", authRoutes); // ✅ good
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use("/api/users", require("./routes/userRoutes"));

// ✅ MongoDB Connection (Fixed: Removed Deprecated Options)
mongoose
  .connect(process.env.MONGODB_URI) // ✅ No deprecated options
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ API Routes
app.use("/api/auth", require("./routes/auth")); // Authentication Routes
app.use("/api/users", require("./routes/userRoutes")); // User Management Routes
app.use("/api/jobs", require("./routes/jobRoutes")); // Connect job routes
app.use("/api/messages", require("./routes/messages"));

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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Real-time chat with Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 New user connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    try {
      const newMsg = new Message(data);
      await newMsg.save();
      io.emit("receiveMessage", newMsg);
    } catch (err) {
      console.error("❌ Message save error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
