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
    const application = new Application({
      jobId,
      craftsmanId,
      coverLetter,
      bidAmount,
    });
    await application.save();
    res.status(201).json(application);
  } catch (error) {
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
router.post("/api/applications", async (req, res) => {
  try {
    const application = await Application.create(req.body);

    // Notify both parties via WebSocket
    broadcastBidUpdate(req, application);

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    if (status === "accepted") {
      const job = await Job.findById(application.jobId._id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Set the job status to 'in progress' and assign the craftsman
      job.status = "in progress";
      job.craftsmanId = application.craftsmanId._id;
      job.startDate = new Date();
      await job.save();
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
