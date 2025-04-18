const express = require("express");
const router = express.Router();
const Invite = require("../models/Invite");
const Job = require("../models/Job");
const Application = require("../models/Application");

// 📊 GET: Stats for a specific craftsman
router.get("/stats/:craftsmanId", async (req, res) => {
  const { craftsmanId } = req.params;

  try {
    // ✅ 1. Count active jobs
    const activeJobs = await Job.countDocuments({
      craftsmanId,
      status: "in progress",
    });

    // ✅ 2. Count job invitations
    const invitations = await Invite.countDocuments({
      craftsmanId,
      status: "pending",
    });

    // ✅ 3. Count proposals (applications)
    const proposals = await Application.countDocuments({ craftsmanId });

    res.json({
      activeJobs,
      invitations,
      proposals,
    });
  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

module.exports = router;
