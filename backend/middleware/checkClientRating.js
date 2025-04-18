const Job = require("../models/Job");

const checkClientRating = async (req, res, next) => {
  try {
    const clientId = req.body.userId || req.query.userId || req.params.userId;

    const unRatedJobs = await Job.find({
      userId: clientId,
      isRatingEnforced: true,
      ratings: 0,
      status: "completed",
    });

    if (unRatedJobs.length > 0) {
      return res.status(403).json({
        message:
          "⛔ You must rate the craftsman for previous completed jobs before continuing.",
        blockedJobs: unRatedJobs.map((job) => ({
          jobId: job._id,
          title: job.title,
        })),
      });
    }

    next();
  } catch (err) {
    console.error("❌ Rating enforcement check failed:", err);
    res
      .status(500)
      .json({ error: "Server error checking client rating requirement" });
  }
};

module.exports = checkClientRating;
