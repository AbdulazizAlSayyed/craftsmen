const express = require("express");
const router = express.Router();
const Application = require("../models/Application"); // adjust path if needed

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
router.patch("/:id/status", async (req, res) => {
  try {
    console.log("PATCH /api/applications/:id/status");
    console.log("Body received:", req.body);
    console.log("ID received:", req.params.id);

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Missing status" });
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating status:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

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
    broadcastBidUpdate(application);

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.patch("/api/applications/:id/status", async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        ...(req.body.bidAmount && { bidAmount: req.body.bidAmount }),
      },
      { new: true }
    )
      .populate("craftsmanId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Notify both parties via WebSocket
    broadcastBidUpdate(application);

    res.json(application);
  } catch (error) {
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
