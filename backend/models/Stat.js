const mongoose = require("mongoose");

const StatSchema = new mongoose.Schema(
  {
    totalUsers: Number,
    newSignups: Number,
    jobsPosted: Number,
    revenue: Number,
    activeUsers: Number,
    newUsers: Number,
    returningUsers: Number,
    reviewScore: Number,
    reviewCount: Number,
    popularSkills: [
      {
        name: String,
        percentage: Number,
      },
    ],
    jobCategories: [
      {
        name: String,
        percentage: Number,
      },
    ],
    reviewDistribution: [
      {
        rating: Number,
        percentage: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stat", StatSchema);
