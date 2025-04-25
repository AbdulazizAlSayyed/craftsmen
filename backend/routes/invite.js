const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification"); // for notifications
const Job = require("../models/Job"); // assuming you have a Job model
const User = require("../models/User"); // to verify users
const Invite = require("../models/Invite"); // ✅ Add this at top

// Invite creation route (POST)
router.post("/", async (req, res) => {
  const { jobId, craftsmanId, clientId } = req.body;

  try {
    // 🔍 Step 1: Check if someone already accepted the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === "in progress" && job.craftsmanId) {
      return res
        .status(403)
        .json({ error: "A craftsman has already been accepted for this job." });
    }

    // 🔁 Step 2: Prevent duplicate invites
    const existingInvite = await Invite.findOne({
      jobId,
      craftsmanId,
      status: "pending",
    });

    if (existingInvite) {
      return res
        .status(409)
        .json({ error: "Invite already sent to this craftsman for this job." });
    }

    // 👤 Step 3: Validate craftsman and client
    const [craftsman, client] = await Promise.all([
      User.findById(craftsmanId),
      User.findById(clientId),
    ]);

    if (!craftsman || !client) {
      return res.status(404).json({ error: "Craftsman or client not found" });
    }

    // 📩 Step 4: Create invite
    const invite = await Invite.create({
      jobId,
      craftsmanId,
      clientId,
      status: "pending",
    });

    // 🔔 Step 5: Notify craftsman
    try {
      await Notification.create({
        user: craftsmanId,
        type: "job_invite",
        content: `${client.username} invited you to the job: "${job.title}"`,
        isRead: false,
        isMarked: false,
      });
    } catch (notificationError) {
      console.warn("Notification creation failed:", notificationError);
    }

    // ✅ Step 6: Success response
    return res.status(200).json({
      message: "Invite sent successfully",
      invite,
    });
  } catch (err) {
    console.error("❌ Error sending invite:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// Route to get job invitations for craftsman
// Get invites for craftsman
// Update the route to match frontend expectation
router.get("/craftsman/:craftsmanId", async (req, res) => {
  try {
    console.log("Fetching invites for craftsman:", req.params.craftsmanId); // Debug log
    const invites = await Invite.find({
      craftsmanId: req.params.craftsmanId,
      status: "pending",
    })
      .populate("jobId", "title description budget")
      .populate("clientId", "username profileImage");

    console.log("Found invites:", invites.length); // Debug log
    res.json(invites);
  } catch (err) {
    console.error("Error fetching invites:", err);
    res.status(500).json({ error: "Failed to fetch invites" });
  }
});
// Route to respond to job invite
// Route to respond to job invite
// Improved invite response route
router.put("/respond/:inviteId", async (req, res) => {
  const { inviteId } = req.params;
  const { response } = req.body; // "accepted" or "rejected"

  try {
    // Find the invite with populated data
    const invite = await Invite.findById(inviteId)
      .populate("jobId", "title description budget status")
      .populate("craftsmanId", "username profileImage")
      .populate("clientId", "username");

    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    // Check if invite is already responded to
    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Invite already responded to" });
    }

    // Update invite status
    invite.status = response;
    await invite.save();

    // If accepted, update the job status and assign craftsman
    if (response === "accepted") {
      const job = await Job.findByIdAndUpdate(
        invite.jobId?._id || invite.jobId,
        {
          status: "in progress",
          craftsmanId: invite.craftsmanId?._id || invite.craftsmanId,
        },
        { new: true }
      );

      await Notification.create({
        user: invite.clientId?._id || invite.clientId,
        type: "job_accepted",
        content: `${
          invite.craftsmanId?.username || "A craftsman"
        } has accepted your job "${invite.jobId?.title || "Untitled"}"`,
        isRead: false,
      });

      return res.status(200).json({
        message: "Invite accepted and job updated",
        invite,
        job,
      });
    }

    // If rejected, just send a notification
    await Notification.create({
      user: invite.clientId._id,
      type: "job_rejected",
      content: `${invite.craftsmanId.username} has declined your job "${invite.jobId.title}"`,
      isRead: false,
    });

    return res.status(200).json({
      message: "Invite declined",
      invite,
    });
  } catch (err) {
    console.error("❌ Error updating invite status:", err);
    return res.status(500).json({
      error: "Failed to update invite status",
      details: err.message,
    });
  }
});
module.exports = router;
