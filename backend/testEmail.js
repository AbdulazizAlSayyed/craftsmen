require("dotenv").config({ path: "./.env" });
const nodemailer = require("nodemailer");

// Confirm env variables
console.log("✅ EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "✅ EMAIL_PASS:",
  process.env.EMAIL_PASS ? "✔ Loaded" : "❌ Not Loaded"
);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"Craftsmen App" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send test email to yourself
      subject: "✅ Nodemailer Test",
      text: "This is a test email sent from Nodemailer using a Gmail App Password.",
    });

    console.log("✅ Email sent successfully:", info.response);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
}

sendTestEmail();
