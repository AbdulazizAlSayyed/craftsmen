const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const chatRoutes = require("./routes/chat");
const profileRoutes = require("./routes/profile");
const applicationRoutes = require("./routes/application");
const settingRoutes = require("./routes/setting");
const inviteRoute = require("./routes/invite");
const adminDashboardRoutes = require("./routes/Admindashboard");
const adminUserRoutes = require("./routes/adminUser");
const categoryRoutes = require("./routes/categories");
const dashboardStatsRoutes = require("./routes/dashboardStats");
const notificationRoutes = require("./routes/notification");
const Message = require("./models/message");
const { Server } = require("socket.io");
const http = require("http");
const { logError, logInfo } = require("./logger");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(express.static(path.join(__dirname, "..", "frontend", "pages")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", chatRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invite", inviteRoute);
app.use("/api/dashboard", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api", require("./routes/blockCheck"));
app.use("/api/dashboard", dashboardStatsRoutes);
app.use("/api", require("./routes/rateJob"));

app.use("/api/categories", categoryRoutes);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => logError(`MongoDB connection error: ${err}`));

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

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

const postRoutesWithIO = require("./routes/postRoutes")(io);
app.use("/api", postRoutesWithIO);

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

  socket.on("bidUpdate", (data) => {
    const craftsman = getUser(data.craftsmanId);
    if (craftsman) {
      io.to(craftsman.socketId).emit("BID_UPDATE", data);
    }

    const client = getUser(data.clientId);
    if (client) {
      io.to(client.socketId).emit("BID_UPDATE", data);
    }
  });

  socket.on(
    "sendMessage",
    async ({ sender, receiver, text, conversationId, tempId }) => {
      const user = getUser(receiver);

      const messageData = {
        sender,
        receiver,
        text,
        conversationId,
        createdAt: new Date(),
        read: false, // ✅ DO NOT auto-read!
      };

      try {
        const newMsg = new Message(messageData);
        await newMsg.save();
        const fullMessage = {
          ...messageData,
          _id: newMsg._id.toString(),
          tempId,
        };

        // Send message to receiver
        if (user) {
          io.to(user.socketId).emit("getMessage", fullMessage);
          io.to(user.socketId).emit("refreshConversations");
        }

        // Send confirmation to sender
        const senderSocket = getUser(sender);
        if (senderSocket) {
          io.to(senderSocket.socketId).emit("messageSaved", fullMessage);
        }

        // Update last message preview
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

  socket.on("typing", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) io.to(user.socketId).emit("showTyping", { senderId });
  });

  socket.on("markAsRead", async ({ conversationId, userId }) => {
    try {
      // Update read status in DB
      const result = await Message.updateMany(
        { conversationId, receiver: userId, read: false },
        { $set: { read: true } }
      );

      // Send real-time update to sender
      const updatedMessages = await Message.find({
        conversationId,
        receiver: userId,
        read: true,
      });

      updatedMessages.forEach((msg) => {
        const sender = getUser(msg.sender.toString());
        if (sender) {
          io.to(sender.socketId).emit("messageReadUpdate", {
            messageId: msg._id.toString(),
          });
        }
      });
    } catch (err) {
      console.error("❌ Failed to update read status:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    users = users.filter((u) => u.socketId !== socket.id);
  });
});

app.use((req, res) => res.status(404).send("Page not found!"));

app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(
      `[ROUTE] ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`
    );
  }
});
server.listen(PORT, () => {
  logInfo(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

app.post("/posts", async (req, res) => {
  const { userId, text } = req.body;

  try {
    const modRes = await axios.post(
      "http://localhost:5000/api/moderatation_api",
      {
        text,
      }
    );

    const { label, confidence } = modRes.data;

    if (label === "unsafe" || confidence < 0.75) {
      return res.status(403).json({
        error: "Moderation failed",
        label,
        confidence,
      });
    }

    // proceed with saving post in DB...
  } catch (err) {
    console.error("🔥 Moderation Service Error:", err.message);
    return res.status(500).json({ error: "Moderation service failed." });
  }
});
