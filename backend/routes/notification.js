// routes/notification.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Get all notifications
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.params.userId,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Toggle mark important
router.put("/mark/:id", async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });

    notif.isMarked = !notif.isMarked;
    await notif.save();
    res.json({ message: "Toggled mark status", isMarked: notif.isMarked });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle mark" });
  }
});
// POST: Send job invite notification
router.post("/invite", async (req, res) => {
  const { craftsmanId, jobId, senderId } = req.body;

  try {
    const job = await require("../models/Job").findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const notification = new Notification({
      user: craftsmanId,
      type: "job_invite",
      content: `You have been invited to apply for "${job.title}"`,
      relatedJob: jobId,
      sender: senderId,
      isRead: false,
      isMarked: false,
    });

    await notification.save();
    res.status(201).json({ message: "Invite sent as notification" });
  } catch (err) {
    console.error("❌ Invite Error:", err);
    res.status(500).json({ error: "Failed to send invite" });
  }
});

module.exports = router;
