const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

// Submit a rating and mark the job as rated
router.post("/rate-job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const { rating } = req.body;

  try {
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      {
        clientRating: rating,
        ratingStatus: "rated", // ✅ Mark job as rated
        ratedAt: new Date(), // ✅ Optional: Timestamp
      },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error rating job:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
