const { spawn } = require("child_process");

function checkContent(text) {
  return new Promise((resolve) => {
    if (!text || typeof text !== "string") {
      return resolve({ safe: true });
    }

    const path = require("path");
    const pythonScriptPath = path.join(__dirname, "../ml/classifier.py");

    const pythonProcess = spawn("python3", [
      pythonScriptPath,
      text.substring(0, 1000),
    ]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0 || !result) {
        console.error("Python script failed");
        return resolve({ safe: false, probability: 1.0 });
      }

      try {
        const { probability, is_toxic } = JSON.parse(result);
        resolve({
          safe: !is_toxic,
          probability,
          message: is_toxic ? "Inappropriate content detected" : "",
        });
      } catch (e) {
        console.error("Failed to parse Python output:", e);
        resolve({ safe: false, probability: 1.0 });
      }
    });
  });
}

module.exports = checkContent; // Directly export the function
