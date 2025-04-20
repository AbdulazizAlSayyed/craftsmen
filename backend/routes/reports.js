const express = require("express");
const router = express.Router();
const Report = require("../models/Reports");

// User submits a report
router.post("/", async (req, res) => {
  try {
    const report = new Report({
      userId: req.body.userId,
      category: req.body.category,
      subject: req.body.subject,
      message: req.body.message,
      reportedDate: new Date(), // Ensure date is set
    });

    await report.save();
    res.status(201).json({ ...report._doc, id: report._id });
  } catch (error) {
    console.error("POST /api/reports error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Admin gets all reports (with optional status filter)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    const reports = await Report.find(filter).sort({ reportedDate: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("GET /api/reports error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Admin updates report status
router.put("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.status = req.body.status || report.status;
    report.adminNotes = req.body.adminNotes || report.adminNotes;
    await report.save();

    res.status(200).json(report);
  } catch (error) {
    console.error("PUT /api/reports/:id error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get a single report by ID
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("GET /api/reports/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// User gets their own reports
router.get("/user/my-reports", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId in query" });
    }

    const reports = await Report.find({ userId }).sort({ reportedDate: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("GET /api/reports/user/my-reports error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
