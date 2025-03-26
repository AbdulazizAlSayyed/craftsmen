const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

// ✅ POST: Create a new job
// ✅ POST: Create a new job
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      milestonesEnabled,
      userId,
      skillsRequired, // ✅ Add this
      jobRank, // ✅ Add this
    } = req.body;

    const newJob = new Job({
      title,
      description,
      budget,
      deadline,
      milestonesEnabled,
      userId,
      skillsRequired, // ✅ Save to DB
      jobRank, // ✅ Save to DB
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
router.get("/completed/:craftsmanId/:skillName", async (req, res) => {
  try {
    const { craftsmanId, skillName } = req.params;

    console.log(
      `🔍 Fetching completed jobs for CraftsmanID: ${craftsmanId}, Skill: ${skillName}`
    );

    const completedJobs = await Job.find({
      craftsmanId,
      status: "completed",
      skillsRequired: { $in: [skillName] },
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
// ✅ GET: Fetch ALL jobs (for homepage or general listing)
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find(); // Fetch all jobs
    res.json(jobs);
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs", error });
  }
});

module.exports = router;
