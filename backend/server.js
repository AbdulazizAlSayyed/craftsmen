const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const chatRoutes = require("./routes/chat");
const profileRoutes = require("./routes/profile");

const { Server } = require("socket.io");
const http = require("http");
const { logError, logInfo } = require("./logger"); // Import logger

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "frontend", "pages")));

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ✅ API Routes (No Duplicates)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", chatRoutes);

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
let users = [];

const addUser = (userId, socketId) => {
  !users.some((u) => u.userId === userId) && users.push({ userId, socketId });
};

const getUser = (userId) => users.find((u) => u.userId === userId);

io.on("connection", (socket) => {
  console.log("📡 User connected:", socket.id);

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    console.log("✅ Added user:", userId);
  });

  socket.on("sendMessage", ({ sender, receiver, text, conversationId }) => {
    const user = getUser(receiver);
    const messageData = {
      sender,
      text,
      conversationId,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      io.to(user.socketId).emit("getMessage", messageData);
    }

    // 💬 Emit to both sender and receiver for updating conversation preview
    [sender, receiver].forEach((uid) => {
      const u = getUser(uid);
      if (u) {
        io.to(u.socketId).emit("lastMessageUpdate", {
          conversationId,
          text,
          createdAt: messageData.createdAt,
        });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    users = users.filter((u) => u.socketId !== socket.id);
  });

  // Typing event (optional)
  socket.on("typing", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("showTyping", { senderId });
    }
  });
});

server.listen(PORT, () => {
  logInfo(`✅ Server is running at http://localhost:${PORT}`); // Log server start
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
