const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messages");
const profileRoutes = require("./routes/profile");


const http = require("http");
const { logError, logInfo } = require("./logger"); // Import logger

const { Server } = require("socket.io");
const Message = require("./models/message");

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend", "pages")));

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ✅ API Routes (No Duplicates)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    logError(`MongoDB connection error: ${err}`); // Log error
  });

// ✅ Serve Frontend Pages
const pages = [
  "signup.html",
  "log-in.html",
  "dashboard.html",
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

// ✅ Default Route (Home Page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "guest.html"));
});

// ✅ Handle 404 Errors
app.use((req, res) => {
  res.status(404).send("Page not found!");
});

// ✅ Start the Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ Real-time Chat with Socket.IO
io.on("connection", (socket) => {
  logInfo(`🔌 New user connected: ${socket.id}`); // Log connection

  socket.on("sendMessage", async (data) => {
    try {
      const newMsg = new Message(data);
      await newMsg.save();
      io.emit("receiveMessage", newMsg);
    } catch (err) {
      logError(`Message save error: ${err}`); // Log message save error
      console.error("❌ Message save error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  logInfo(`✅ Server is running at http://localhost:${PORT}`); // Log server start
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
