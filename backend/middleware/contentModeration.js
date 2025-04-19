const axios = require("axios");
const checkContent = require("../utils/contentUtils");

// ✅ Words that should be auto-approved
const SAFE_WORDS = [
  "painting",
  "electrical",
  "pottery",
  "wood",
  "carving",
  "stone",
  "plumbing",
  "carpentry",
  "leathercraft",
  "ceramics",
  "milestone",
  "refund",
  "freelancer",
];

// ✅ Words that should trigger an automatic block (hard filter)
const BLOCKLIST = ["kill", "hate", "die", "idiot", "trash", "moron"];

// Check for hard banned keywords
const containsBannedWords = (text) => {
  return BLOCKLIST.some((word) => text.toLowerCase().includes(word));
};

// Determine whether a field should go through ML moderation
const shouldModerate = (text) => {
  if (!text) return false;
  const words = text.toLowerCase().split(/\s+/);
  return !words.some((word) => SAFE_WORDS.includes(word));
};

const contentModeration = async (req, res, next) => {
  // Skip moderation on GET requests
  if (req.method === "GET" || req.headers["x-internal-request"] === "true") {
    return next();
  }
  if (req.method === "GET") return next();

  // 🔍 Fields to moderate based on route
  const moderationMap = {
    "/api/jobs": ["title", "description"],
    "/api/posts": ["content"],
    "/api/profile": ["bio"],
    "/api/chat": ["text"],
  };

  const route = Object.keys(moderationMap).find((path) =>
    req.path.startsWith(path)
  );
  if (!route) return next();

  try {
    if (!req.body) {
      console.error(
        "❌ Request body is undefined. Check if express.json() is used."
      );
      return res.status(500).json({
        error: "Request body missing",
        message: "Could not read request data. Contact admin.",
      });
    }

    for (const field of moderationMap[route]) {
      const fieldValue = req.body[field];

      // 🛑 Hard keyword blocking
      if (fieldValue && shouldModerate(fieldValue)) {
        try {
          const { safe, probability, message } = await checkContent(fieldValue);

          if (!safe) {
            return res.status(400).json({
              error: "Content moderation failed",
              message: message || "Inappropriate content detected",
              field,
              probability: probability || 1.0,
            });
          }
        } catch (error) {
          console.error("ML moderation failed:", error);
          // Fail safely - you might want to allow or block by default
          return res.status(500).json({
            error: "Content verification failed",
            message: "Could not verify content safety",
          });
        }
      }
    }

    next(); // ✅ Passed moderation
  } catch (error) {
    console.error("🛑 Moderation service error:", error.message);
    return res.status(500).json({
      error: "Content verification service unavailable",
      message: "Could not verify content safety",
    });
  }
};

module.exports = contentModeration;
