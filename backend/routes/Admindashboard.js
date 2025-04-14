// File: routes/Admindashboard.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Job = require("../models/Job");

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo },
    });

    const jobsPosted = await Job.countDocuments({
      createdAt: { $gte: monthStart },
    });

    const revenueAgg = await Job.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$budget" } } },
    ]);
    const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    const skillsAgg = await User.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const totalUsersCount = await User.countDocuments();
    const totalJobsCount = await Job.countDocuments();

    const popularSkills = skillsAgg.map((s) => ({
      name: s._id || "Unspecified",
      count: s.count,
      percentage:
        totalUsersCount > 0 ? Math.round((s.count / totalUsersCount) * 100) : 0,
    }));

    const jobAgg = await Job.aggregate([
      { $unwind: "$skillsRequired" },
      { $group: { _id: "$skillsRequired", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const jobCategories = jobAgg.map((j) => ({
      name: j._id,
      count: j.count,
      percentage:
        totalJobsCount > 0 ? Math.round((j.count / totalJobsCount) * 100) : 0,
    }));

    const reviews = await Job.find({
      status: "completed",
      ratings: { $gt: 0 },
    });
    const reviewCount = reviews.length;
    const reviewScore =
      reviewCount > 0
        ? (
            reviews.reduce((acc, j) => acc + j.ratings, 0) / reviewCount
          ).toFixed(1)
        : 0;
    const reviewDistribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (j) => Math.round(j.ratings) === star
      ).length;
      const percentage =
        reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
      return { rating: star, percentage };
    });

    // 🔥 NEW: Add clients vs. craftsmen
    const clientCount = await User.countDocuments({ role: "client" });
    const craftsmanCount = await User.countDocuments({ role: "craftsman" });

    // 🔥 NEW: Users who posted jobs vs. got hired
    const usersPosted = await Job.distinct("userId").then((u) => u.length);
    const usersHired = await Job.distinct("craftsmanId").then(
      (u) => u.filter(Boolean).length
    );

    res.json({
      totalUsers,
      newSignups: newUsers,
      activeUsers,
      jobsPosted,
      revenue,
      popularSkills,
      jobCategories,
      reviewScore,
      reviewCount,
      reviewDistribution,
      clientCount,
      craftsmanCount,
      usersPosted,
      usersHired,
    });
  } catch (err) {
    console.error("❌ Dashboard Error:", err);
    res.status(500).json({ message: "Dashboard fetch failed" });
  }
});

module.exports = router;
