// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose");

// Create a new post
router.post("/posts", async (req, res) => {
  const { userId, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Post text required" });
  }

  try {
    const post = new Post({ userId, text: text.trim() });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get all posts (with user and comment user info)
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "fullName profileImage skills")
      .populate("comments.userId", "fullName");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Like a post
router.post("/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    const userIdStr = userId.toString();

    if (!post.likes.includes(userIdStr)) {
      post.likes.push(userIdStr);
      post.dislikes = post.dislikes.filter((id) => id.toString() !== userIdStr);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to like post" });
  }
});

// Dislike a post
router.post("/posts/:id/dislike", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    const userIdStr = userId.toString();

    if (!post.dislikes.includes(userIdStr)) {
      post.dislikes.push(userIdStr);
      post.likes = post.likes.filter((id) => id.toString() !== userIdStr);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to dislike post" });
  }
});

// Add a comment
router.post("/posts/:id/comment", async (req, res) => {
  const { userId, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Comment text required" });
  }

  try {
    const commentId = new mongoose.Types.ObjectId();
    const post = await Post.findById(req.params.id);
    post.comments.push({ _id: commentId, userId, text: text.trim() });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to comment" });
  }
});

// Like a comment
router.post("/posts/:id/comments/:commentId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const userIdStr = userId.toString();
    const post = await Post.findById(req.params.id);
    const comment = post.comments.id(req.params.commentId);

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (!comment.likes.includes(userIdStr)) {
      comment.likes.push(userIdStr);
      comment.dislikes = comment.dislikes.filter(
        (id) => id.toString() !== userIdStr
      );
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to like comment" });
  }
});

// Dislike a comment
router.post("/posts/:id/comments/:commentId/dislike", async (req, res) => {
  try {
    const { userId } = req.body;
    const userIdStr = userId.toString();
    const post = await Post.findById(req.params.id);
    const comment = post.comments.id(req.params.commentId);

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (!comment.dislikes.includes(userIdStr)) {
      comment.dislikes.push(userIdStr);
      comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to dislike comment" });
  }
});

// 🗑️ DELETE Post - only if user is post creator
router.delete("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId.toString() !== userId)
      return res.status(403).json({ error: "Unauthorized: not your post" });
    await post.deleteOne();
    res.json({ message: "✅ Post deleted" });
  } catch (err) {
    res.status(500).json({ error: "❌ Failed to delete post" });
  }
});

// 🗑️ DELETE Comment - author OR post creator
router.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  const { postId, commentId } = req.params;
  const { userId } = req.body;
  try {
    const post = await Post.findById(postId);
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isCommentAuthor = comment.userId.toString() === userId;
    const isPostOwner = post.userId.toString() === userId;

    if (!isCommentAuthor && !isPostOwner)
      return res.status(403).json({ error: "Unauthorized to delete comment" });

    comment.deleteOne();
    await post.save();
    res.json({ message: "✅ Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "❌ Failed to delete comment" });
  }
});

// ✏️ UPDATE Comment - only by author, within 5 min
router.put("/posts/:postId/comments/:commentId", async (req, res) => {
  const { postId, commentId } = req.params;
  const { userId, text } = req.body;
  try {
    const post = await Post.findById(postId);
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.userId.toString() !== userId)
      return res.status(403).json({ error: "Unauthorized to edit comment" });

    const now = Date.now();
    const createdAt = new Date(comment.createdAt).getTime();
    const diff = now - createdAt;

    if (diff > 5 * 60 * 1000) {
      return res
        .status(403)
        .json({ error: "⏳ Time expired. You can't edit this comment." });
    }

    comment.text = text.trim();
    await post.save();
    res.json({ message: "✅ Comment updated", comment });
  } catch (err) {
    res.status(500).json({ error: "❌ Failed to update comment" });
  }
});

module.exports = router;
