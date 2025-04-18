// notifications-common.js

async function checkUnreadNotifications() {
  const craftsmanId = localStorage.getItem("craftsmanId");
  if (!craftsmanId) return;

  try {
    const res = await fetch(`/api/notifications/${craftsmanId}`);
    if (!res.ok) throw new Error("Failed to fetch notifications");

    const data = await res.json();
    const hasUnread = data.some((n) => !n.isRead);
    const notifDot = document.getElementById("notif-dot");
    if (notifDot) {
      notifDot.classList.toggle("hidden", !hasUnread);
    }
  } catch (err) {
    console.error("❌ Notification check failed:", err);
  }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", checkUnreadNotifications);
