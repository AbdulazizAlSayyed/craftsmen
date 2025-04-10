const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification"); // for notifications
const Job = require("../models/Job"); // assuming you have a Job model
const User = require("../models/User"); // to verify users

// POST /api/invite
router.post("/", async (req, res) => {
  const { jobId, craftsmanId, clientId } = req.body;

  try {
    // Optional: validate the users and job
    const job = await Job.findById(jobId);
    const craftsman = await User.findById(craftsmanId);
    const client = await User.findById(clientId);

    if (!job || !craftsman || !client) {
      return res.status(404).json({ error: "Job or user not found" });
    }

    // Send notification to craftsman
    await Notification.create({
      user: craftsmanId,
      type: "job_invite",
      content: `${client.username} invited you to the job: "${job.title}"`,
      isRead: false,
      isMarked: false,
    });

    res.status(200).json({ message: "Invite sent and notification created" });
  } catch (err) {
    console.error("❌ Error sending invite:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
