const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

// ✅ POST: Create a new job
router.post("/", async (req, res) => {
  // Route should be "/" not "/create"
  try {
    const {
      title,
      description,
      budget,
      deadline,
      categories,
      milestonesEnabled,
      userId,
    } = req.body;

    const newJob = new Job({
      title,
      description,
      budget,
      deadline,
      categories,
      milestonesEnabled,
      userId,
    });

    await newJob.save();
    res.status(201).json({ message: "Job posted successfully", job: newJob });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating job", error: error.message });
  }
});

// ✅ GET: Fetch all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching jobs", error: error.message });
  }
});
router.get("/completed/:craftsmanId/:skillName", async (req, res) => {
  try {
    const { craftsmanId, skillName } = req.params;

    console.log(
      `🔍 Fetching completed jobs for CraftsmanID: ${craftsmanId}, Skill: ${skillName}`
    );

    const completedJobs = await Job.find({
      craftsmanId: craftsmanId, // ✅ Ensure craftsmanId is used correctly
      status: "completed",
      categories: { $in: [skillName] }, // ✅ Ensure category filter
    }).lean();

    if (!completedJobs.length) {
      return res
        .status(404)
        .json({ message: `No completed jobs found for ${skillName}` });
    }

    res.json(completedJobs);
  } catch (error) {
    console.error("❌ Error fetching completed jobs:", error);
    res.status(500).json({ message: "Error fetching completed jobs", error });
  }
});

module.exports = router;
