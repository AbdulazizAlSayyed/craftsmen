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
    const { status } = req.body;
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

module.exports = router;
