const express = require("express");
const path = require("path");
const app = express();

const PORT = 5000;

// ✅ Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ✅ Serve guest.html when visiting "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "guest.html"));
});

// ✅ Serve all pages manually
app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "signup.html"));
});

app.get("/log-in.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "log-in.html"));
});

app.get("/dashborad.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "dashborad.html")
  );
});

app.get("/Explore.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "Explore.html"));
});

app.get("/profile.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "profile.html"));
});
app.get("/Profile2.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "Profile2.html")
  );
});
app.get("/job.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "job.html"));
});

app.get("/Notification.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "Notification.html")
  );
});

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "chat.html"));
});

app.get("/myjob.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "myjob.html"));
});

app.get("/new.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "new.html"));
});

app.get("/proposal.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "proposal.html")
  );
});

app.get("/proposalFinal.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "proposalFinal.html")
  );
});

app.get("/post.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "post.html"));
});

app.get("/Reset-your-password.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "Reset-your-password.html")
  );
});

app.get("/Setting.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "Setting.html"));
});

app.get("/t1.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "pages", "t1.html"));
});
app.get("/Forgot-your-password.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "Forgot-your-password.html")
  );
});

app.get("/verification-email.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "frontend", "pages", "verification-email.html")
  );
});

// ✅ Handle 404 errors
app.use((req, res) => {
  res.status(404).send("Page not found!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
