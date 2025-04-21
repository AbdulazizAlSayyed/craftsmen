const express = require("express");
const router = express.Router();
const FreePost = require("../models/FreePost");
const Job = require("../models/Job");

//const OpenAI = require("openai");
/*
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
*/
const axios = require("axios");

// Create Free Post with AI
router.post("/", async (req, res) => {
  const { userId, prompt } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    /*
    const aiRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const aiReply = aiRes.choices[0].message.content;
*/
    const aiRes = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1", // You can also try gpt-3.5-turbo if available
        messages: [
          {
            role: "system",
            content:
              "You are a job-posting assistant. Given a user's request, return a JSON object with the following fields only:\n\n" +
              `{
        "title": "...",
        "description": "...",
        "budget": ..., // number
        "deadline": "...", // ISO date format (e.g. 2025-06-01)
        "jobRank": "Beginner" | "Advanced" | "Expert",
        "skillsRequired": ["Skill1", "Skill2"]
      }\n\n` +
              "DO NOT include explanations or text outside the JSON. Just return the JSON.",
          },
          {
            role: "user",
            content: prompt, // this is whatever the user types, e.g. "I need someone to repaint my room and fix the curtain rod"
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = aiRes.data.choices[0].message.content;

    let jobData;
    try {
      jobData = JSON.parse(aiReply); // This parses the JSON output from the AI
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Invalid AI response. Could not parse JSON." });
    }

    const newJob = new Job({
      ...jobData,
      userId,
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/:userId", async (req, res) => {
  try {
    const posts = await FreePost.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve AI posts" });
  }
});

module.exports = router;
