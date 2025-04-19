const express = require("express");
const router = express.Router();
const Application = require("../models/Application"); // adjust path if needed
const Job = require("../models/Job");
function broadcastBidUpdate(req, updatedApp) {
  const io = req.app.get("io");

  if (!io) {
    console.warn("❌ Socket.IO not available in req.app.");
    return;
  }

  io.emit("BID_UPDATE", updatedApp);
  console.log("📡 BID_UPDATE emitted for app ID:", updatedApp._id);
}

// Create application
// POST /api/applications
router.post("/", async (req, res) => {
  try {
    const { jobId, craftsmanId, coverLetter, bidAmount } = req.body;

    const JobModel = require("../models/Job");
    const UserModel = require("../models/User");

    const job = await JobModel.findById(jobId);
    const craftsman = await UserModel.findById(craftsmanId);

    if (!job || !craftsman) {
      return res.status(404).json({ error: "Job or Craftsman not found" });
    }

    // Rule 1: Craftsman must have all required job skills
    const jobSkills = job.skillsRequired || [];
    const craftsmanSkills = (craftsman.skills || []).map((s) => s.name);
    const missingSkills = jobSkills.filter(
      (skill) => !craftsmanSkills.includes(skill)
    );

    if (missingSkills.length > 0) {
      return res.status(400).json({
        error: `You don't have the required skills: ${missingSkills.join(
          ", "
        )}`,
      });
    }

    // Rule 2: Craftsman's highest rank must meet job rank
    const RANKS = { Beginner: 1, Advanced: 2, Expert: 3 };
    const jobRankLevel = RANKS[job.jobRank] || 1;
    const craftsmanTopLevel = Math.max(
      ...craftsman.skills.map((s) => RANKS[s.rank || "Beginner"] || 1)
    );

    if (craftsmanTopLevel < jobRankLevel) {
      return res.status(400).json({
        error: `You must be at least ${job.jobRank} level to apply.`,
      });
    }

    // Rule 3: Cannot apply to your own job
    if (job.userId.toString() === craftsmanId.toString()) {
      return res
        .status(403)
        .json({ error: "You cannot apply to your own job." });
    }

    // Rule 4: Cannot apply if already applied and not rejected
    // Rule 4: If already applied and not rejected, block
    const existing = await Application.findOne({ jobId, craftsmanId });

    if (existing && existing.status !== "rejected") {
      return res
        .status(400)
        .json({ error: "You already applied to this job." });
    }

    // Optional: If previously rejected, delete the old application so we only keep one
    if (existing && existing.status === "rejected") {
      await Application.findByIdAndDelete(existing._id);
    }

    // ✅ Passed all checks — create application
    const application = new Application({
      jobId,
      craftsmanId,
      coverLetter,
      bidAmount,
      status: "pending",
    });

    await application.save();

    // Optional: Broadcast the bid if needed
    broadcastBidUpdate(req, application);

    res.status(201).json(application);
  } catch (error) {
    console.error("❌ Application error:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/applications
router.get("/", async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("craftsmanId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/job/:jobId
router.get("/job/:jobId", async (req, res) => {
  try {
    const applications = await Application.find({
      jobId: req.params.jobId,
    }).populate("craftsmanId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// PATCH /api/applications/:id/status

// GET /api/applications/craftsman/:id
router.get("/craftsman/:id", async (req, res) => {
  try {
    const applications = await Application.find({
      craftsmanId: req.params.id,
    }).populate("jobId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// applicationRoutes.js
router.get("/craftsman/:id", async (req, res) => {
  try {
    const applications = await Application.find({
      craftsmanId: req.params.id,
    }).populate({
      path: "jobId",
      select: "title budget skillsRequired jobRank", // 👈 make sure skillsRequired is included
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /api/applications/job/:jobId
router.get("/job/:jobId", async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("craftsmanId", "fullName skills profileImage email") // select only needed fields
      .populate("jobId", "title"); // optional if you want job title
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/applications/:id/status

router.patch("/:id/status", async (req, res) => {
  try {
    const { status, bidAmount } = req.body;

    // 1. Find and update the application
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(bidAmount && { bidAmount }),
      },
      { new: true }
    )
      .populate("craftsmanId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // 2. If status is accepted, update the Job
    // 2. If status is accepted, update the Job
    if (status === "accepted") {
      const job = await Job.findById(application.jobId._id);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // ❌ Prevent assigning a job already taken
      if (job.craftsmanId) {
        return res.status(400).json({
          error: "This job has already been assigned to another craftsman.",
        });
      }

      // ✅ Assign craftsman and start job
      job.status = "in progress";
      job.craftsmanId = application.craftsmanId._id;
      job.startDate = new Date();
      await job.save();

      // Optional: auto-reject other applicants
      await Application.updateMany(
        {
          jobId: job._id,
          _id: { $ne: application._id },
          status: { $nin: ["rejected", "accepted"] },
        },
        { status: "rejected" }
      );
    }

    // 3. Broadcast update
    broadcastBidUpdate(req, application);

    res.json(application);
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(400).json({ error: error.message });
  }
});

// Assuming Express.js
router.post("/:id/update-bid", async (req, res) => {
  const { id } = req.params;
  const { bidAmount } = req.body;

  try {
    const updatedApp = await Application.findByIdAndUpdate(
      id,
      { bidAmount, status: "pending" }, // Reset status after re-bidding if needed
      { new: true }
    );
    if (!updatedApp) return res.status(404).send("Application not found.");
    res.json(updatedApp);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
