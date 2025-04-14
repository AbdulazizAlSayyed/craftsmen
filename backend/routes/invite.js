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
    // 1. Find all required documents first
    const [job, craftsman, client] = await Promise.all([
      Job.findById(jobId),
      User.findById(craftsmanId),
      User.findById(clientId),
    ]);

    if (!job || !craftsman || !client) {
      return res.status(404).json({ error: "Job or user not found" });
    }

    // 2. Create invite
    const invite = await Invite.create({ jobId, craftsmanId, clientId });

    // 3. Create notification (wrap in try-catch to prevent blocking)
    try {
      await Notification.create({
        user: craftsmanId,
        type: "job_invite",
        content: `${client.username} invited you to the job: "${job.title}"`,
        isRead: false,
        isMarked: false,
      });
    } catch (notificationError) {
      console.error("Notification creation failed:", notificationError);
      // Continue even if notification fails
    }

    // 4. Return success response
    return res.status(200).json({
      message: "Invite sent successfully",
      invite,
      job: { title: job.title }, // Include minimal job info
    });
  } catch (err) {
    console.error("❌ Error sending invite:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message, // Include error details for debugging
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
router.put("/respond/:inviteId", async (req, res) => {
  const { inviteId } = req.params;
  const { response } = req.body; // "accepted" or "rejected"

  try {
    // Find the invite by ID and update the status
    const invite = await Invite.findByIdAndUpdate(
      inviteId,
      { status: response }, // Set status to 'accepted' or 'rejected'
      { new: true } // Return the updated invite
    );

    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    // Respond with the updated invite data
    res.json({ message: "Invite status updated successfully", invite });
  } catch (err) {
    console.error("❌ Error updating invite status:", err);
    res.status(500).json({ error: "Failed to update invite status" });
  }
});

module.exports = router;
