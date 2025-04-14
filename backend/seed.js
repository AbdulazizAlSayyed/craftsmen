const mongoose = require("mongoose");
const Stat = require("./models/Stat");

mongoose.connect("mongodb://localhost:27017/craftsman").then(async () => {
  await Stat.create({
    totalUsers: 2540,
    newSignups: 120,
    jobsPosted: 350,
    revenue: 45000,
    activeUsers: 1850,
    newUsers: 1200,
    returningUsers: 650,
    reviewScore: 4.7,
    reviewCount: 850,
    popularSkills: [
      { name: "Plumbing", percentage: 80 },
      { name: "Carpentry", percentage: 30 },
      { name: "Electrical Work", percentage: 80 },
      { name: "Painting", percentage: 70 },
      { name: "Landscaping", percentage: 100 },
    ],
    jobCategories: [
      { name: "Home Repair", percentage: 20 },
      { name: "Construction", percentage: 10 },
      { name: "Interior Design", percentage: 90 },
      { name: "Gardening", percentage: 50 },
      { name: "Cleaning", percentage: 10 },
    ],
    reviewDistribution: [
      { rating: 5, percentage: 50 },
      { rating: 4, percentage: 30 },
      { rating: 3, percentage: 10 },
      { rating: 2, percentage: 5 },
      { rating: 1, percentage: 5 },
    ],
  });

  console.log("Sample dashboard stat inserted!");
  process.exit();
});
