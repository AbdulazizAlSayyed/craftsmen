const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "logs", "app.log");

// Ensure the logs directory exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

const logError = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ERROR: ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
};

const logInfo = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - INFO: ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
};

module.exports = { logError, logInfo };
