// chat-dot.js
document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch(`/api/conversations/${userId}`);
    const conversations = await res.json();

    const hasUnread = conversations.some((c) => c.unreadCount > 0);
    const chatDot = document.getElementById("chat-dot");

    if (chatDot) {
      chatDot.classList.toggle("hidden", !hasUnread);
    }
  } catch (err) {
    console.error("❌ Failed to fetch conversations for chat dot", err);
  }
});
