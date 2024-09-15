const { remote } = require("electron");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

// Function to write configuration
async function writeConfig(username, password) {
  try {
    const config = { username, password };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    alert("Configuration saved successfully.");
  } catch (error) {
    console.error("Error writing config:", error);
    alert("Error saving configuration.");
  }
}

// Event listener for the save button
document.getElementById("save-btn").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username && password) {
    writeConfig(username, password);
  } else {
    alert("Please enter both username and password.");
  }
});

// Load existing configuration if available
window.onload = () => {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      document.getElementById("username").value = config.username || "";
      document.getElementById("password").value = config.password || "";
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }
};
