module.exports = function (io) {
  const express = require("express");
  const router = express.Router();
  const Post = require("../models/Post");
  const User = require("../models/User");
  const mongoose = require("mongoose");

  // Create a new post
  router.post("/posts", async (req, res) => {
    const { userId, text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Post text required" });
    }

    try {
      const post = new Post({ userId, text: text.trim() });
      await post.save();

      const populatedPost = await Post.findById(post._id).populate(
        "userId",
        "fullName profileImage skills"
      );

      io.emit("newPost", populatedPost); // 🔥 Realtime emit
      res.status(201).json(populatedPost);
    } catch (err) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Get all posts
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
        post.dislikes = post.dislikes.filter(
          (id) => id.toString() !== userIdStr
        );
      }

      await post.save();
      io.emit("postLiked", post); // ✅
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
      io.emit("postDisliked", post); // ✅
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: "Failed to dislike post" });
    }
  });

  // Add a comment
  router.post("/posts/:id/comment", async (req, res) => {
    const { userId, text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Comment text required" });
    }

    try {
      const commentId = new mongoose.Types.ObjectId();
      const post = await Post.findById(req.params.id);
      const comment = {
        _id: commentId,
        userId,
        text: text.trim(),
        createdAt: new Date(),
      };
      post.comments.push(comment);
      await post.save();

      const user = await User.findById(userId).select("fullName");
      const populatedComment = {
        ...comment,
        userId: { _id: userId, fullName: user.fullName },
      };

      io.emit("newComment", {
        postId: req.params.id,
        comment: populatedComment,
      });

      res.json(post);
    } catch (err) {
      res.status(500).json({ error: "Failed to comment" });
    }
  });

  // Like a comment
  router.post("/posts/:id/comments/:commentId/like", async (req, res) => {
    try {
      const { userId } = req.body;
      const post = await Post.findById(req.params.id);
      const comment = post.comments.id(req.params.commentId);
      const userIdStr = userId.toString();

      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (!comment.likes.includes(userIdStr)) {
        comment.likes.push(userIdStr);
        comment.dislikes = comment.dislikes.filter(
          (id) => id.toString() !== userIdStr
        );
      }

      await post.save();
      io.emit("commentUpdated", { postId: post._id, comment });
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: "Failed to like comment" });
    }
  });

  // Dislike a comment
  router.post("/posts/:id/comments/:commentId/dislike", async (req, res) => {
    try {
      const { userId } = req.body;
      const post = await Post.findById(req.params.id);
      const comment = post.comments.id(req.params.commentId);
      const userIdStr = userId.toString();

      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (!comment.dislikes.includes(userIdStr)) {
        comment.dislikes.push(userIdStr);
        comment.likes = comment.likes.filter(
          (id) => id.toString() !== userIdStr
        );
      }

      await post.save();
      io.emit("commentUpdated", { postId: post._id, comment });
      res.json(post);
    } catch (err) {
      res.status(500).json({ error: "Failed to dislike comment" });
    }
  });

  // Update comment
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
      if (now - createdAt > 5 * 60 * 1000) {
        return res.status(403).json({
          error: "⏳ Time expired. You can't edit this comment.",
        });
      }

      comment.text = text.trim();
      await post.save();

      io.emit("commentUpdated", { postId, comment });
      res.json({ message: "✅ Comment updated", comment });
    } catch (err) {
      res.status(500).json({ error: "❌ Failed to update comment" });
    }
  });

  // Delete comment (author or post owner)
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
        return res
          .status(403)
          .json({ error: "Unauthorized to delete comment" });

      comment.deleteOne();
      await post.save();

      io.emit("commentDeleted", { postId, commentId });
      res.json({ message: "✅ Comment deleted" });
    } catch (err) {
      res.status(500).json({ error: "❌ Failed to delete comment" });
    }
  });

  // Delete post (only author)
  router.delete("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;

    try {
      const post = await Post.findById(postId);

      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.userId.toString() !== userId)
        return res.status(403).json({ error: "Unauthorized: not your post" });

      await post.deleteOne();

      io.emit("postDeleted", { postId });
      res.json({ message: "✅ Post deleted" });
    } catch (err) {
      res.status(500).json({ error: "❌ Failed to delete post" });
    }
  });

  return router;
};
