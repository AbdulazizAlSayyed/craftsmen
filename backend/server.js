const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const chatRoutes = require("./routes/chat");
const profileRoutes = require("./routes/profile");
const applicationRoutes = require("./routes/application");
const settingRoutes = require("./routes/setting");
const Message = require("./models/message");

const { Server } = require("socket.io");
const http = require("http");
const { logError, logInfo } = require("./logger");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(express.static(path.join(__dirname, "..", "frontend", "pages")));

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", chatRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/applications", applicationRoutes);
// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    logError(`MongoDB connection error: ${err}`);
  });

// Serve Frontend Pages
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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "guest.html"));
});

// Create HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

// Post routes (after io exists)
const postRoutesWithIO = require("./routes/postRoutes")(io);
app.use("/api", postRoutesWithIO);

app.use((req, res) => {
  res.status(404).send("Page not found!");
});

// -----------------------------
// 🧠 Real-time Chat via Socket.IO
// -----------------------------
let users = [];

const addUser = (userId, socketId) => {
  if (!users.some((u) => u.userId === userId)) {
    users.push({ userId, socketId });
  }
};

const getUser = (userId) => users.find((u) => u.userId === userId);

io.on("connection", (socket) => {
  console.log("📡 User connected:", socket.id);

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    console.log("✅ Added user:", userId);
  });

  // Sending a message
  socket.on(
    "sendMessage",
    async ({ sender, receiver, text, conversationId, tempId }) => {
      const user = getUser(receiver);
      const messageData = {
        sender,
        receiver,
        text,
        conversationId,
        createdAt: new Date().toISOString(),
        read: !!user,
      };

      try {
        const newMsg = new Message(messageData);
        await newMsg.save();

        const fullMessage = {
          ...messageData,
          _id: newMsg._id.toString(),
          tempId, // 🧠 include tempId so frontend can match it
        };

        // Send to receiver
        if (user) {
          io.to(user.socketId).emit("getMessage", fullMessage);
        }

        // Send to sender (optional real-time echo with _id)
        const senderSocket = getUser(sender);
        if (senderSocket) {
          io.to(senderSocket.socketId).emit("messageSaved", fullMessage);
        }

        // Update previews
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
      } catch (err) {
        console.error("❌ Failed to save or emit message:", err);
      }
    }
  );

  // Typing indicator
  socket.on("typing", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("showTyping", { senderId });
    }
  });

  // Mark messages as read
  socket.on("markAsRead", async ({ conversationId, userId }) => {
    try {
      await Message.updateMany(
        {
          conversationId,
          receiver: userId,
          read: false,
        },
        { $set: { read: true } }
      );

      const senderMsgs = await Message.find({
        conversationId,
        receiver: userId,
        read: true,
      });

      senderMsgs.forEach((msg) => {
        const senderUser = getUser(msg.sender.toString());
        if (senderUser) {
          io.to(senderUser.socketId).emit("messageReadUpdate", {
            messageId: msg._id.toString(),
          });
        }
      });
    } catch (err) {
      console.error("❌ Failed to update read status:", err);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    users = users.filter((u) => u.socketId !== socket.id);
  });
});

server.listen(PORT, () => {
  logInfo(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
