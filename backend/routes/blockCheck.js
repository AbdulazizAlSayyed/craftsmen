const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

// Check if client should be blocked for rating enforcement
router.get("/check-client-block/:userId", async (req, res) => {
  const { userId } = req.params;
  const currentDate = new Date();

  const jobs = await Job.find({
    userId: userId,
    status: "completed",
    ratingStatus: "not-rated", // ✅ Will now be "rated" after submission
    isRatingEnforced: true,
  });

  for (let job of jobs) {
    const allowedDays =
      job.jobRank === "Beginner"
        ? 1
        : job.jobRank === "Advanced"
        ? 2
        : job.jobRank === "Expert"
        ? 3
        : 1;

    const enforceRatingDate = new Date(
      job.deadline.getTime() + allowedDays * 24 * 60 * 60 * 1000
    );

    if (currentDate > enforceRatingDate) {
      return res.json({ blocked: true, jobId: job._id });
    }
  }

  res.json({ blocked: false });
});

module.exports = router;
