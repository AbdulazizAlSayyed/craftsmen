const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const checkClientRating = require("../middleware/checkClientRating");

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
router.get("/auto-complete", async (req, res) => {
  try {
    const now = new Date();
    const rankDelays = {
      Beginner: 1,
      Advanced: 2,
      Expert: 3,
    };

    const inProgressJobs = await Job.find({
      status: "in progress",
      craftsmanId: { $ne: null },
    });

    const updatedJobs = [];

    for (const job of inProgressJobs) {
      const delay = rankDelays[job.jobRank] || 1;
      const completionTime = new Date(job.deadline);
      completionTime.setDate(completionTime.getDate() + delay);

      if (now >= completionTime) {
        // Mark job as completed
        job.status = "completed";
        job.autoCompletedAt = now;

        // Check rating status
        if (job.ratings === 0 && job.ratingStatus === "not-rated") {
          job.isRatingEnforced = true; // Client must rate
        }

        await job.save();
        updatedJobs.push(job._id);
      }
    }

    res.json({
      message: "Auto-completion check done",
      completedJobs: updatedJobs,
    });
  } catch (err) {
    console.error("❌ Auto-complete failed:", err);
    res.status(500).json({ error: "Auto-complete failed" });
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

// ✅ GET jobs posted by a specific user
router.get("/posted/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("✅ Received userId:", userId);

    const jobs = await Job.find({ userId });
    console.log("✅ Jobs found:", jobs);

    res.json(jobs);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET current jobs assigned to this craftsman and in progress
router.get("/current/:craftsmanId", async (req, res) => {
  const { craftsmanId } = req.params;
  const jobs = await Job.find({
    status: "in progress",
    craftsmanId,
  }).sort({ deadline: 1 });

  res.json(jobs);
});

// ✅ POST: Mark a job as completed by craftsman and notify client to rate
// ✅ POST: Mark a job as completed by craftsman and notify client to rate
router.post("/complete", async (req, res) => {
  try {
    const { jobId, clientId } = req.body;

    // 🔍 Debug log
    console.log("📤 Job completion request:", { jobId, clientId });

    if (!jobId || !clientId) {
      return res.status(400).json({ message: "Missing jobId or clientId" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.status = "completed";
    job.autoCompletedAt = new Date();
    job.ratingStatus = "not-rated";
    job.isRatingEnforced = true;

    await job.save();

    const Notification = require("../models/Notification");

    // ✅ Validate that clientId is a valid ObjectId before using it
    if (typeof clientId !== "string" || clientId.length !== 24) {
      throw new Error("Invalid clientId format.");
    }

    await Notification.create({
      user: clientId,
      type: "rating_request",
      content: `Your job "${job.title}" has been marked as complete. Please rate your craftsman.`,
      isRead: false,
      isMarked: false,
    });

    res.json({ message: "Job marked as complete. Client notified to rate." });
  } catch (err) {
    console.error("❌ Error completing job:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// /api/jobs/check-unrated-completions
router.get("/check-unrated-completions", async (req, res) => {
  try {
    const now = new Date();
    const rankDelays = {
      Beginner: 1,
      Advanced: 2,
      Expert: 3,
    };

    const completedJobs = await Job.find({ status: "completed", ratings: 0 });

    let blockedClients = [];

    for (const job of completedJobs) {
      const delay = rankDelays[job.jobRank] || 1;
      const jobDueDate = new Date(job.deadline);
      jobDueDate.setDate(jobDueDate.getDate() + delay);

      if (now >= jobDueDate) {
        // Mark the client as blocked
        const User = require("../models/User");
        const client = await User.findById(job.userId);

        if (client && !client.blockForMissingRating) {
          client.blockForMissingRating = true;
          await client.save();
          blockedClients.push(client._id);
        }
      }
    }

    res.json({
      message: "Checked completed jobs for missing ratings",
      blockedClients,
    });
  } catch (err) {
    console.error("❌ Error in manual check:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
