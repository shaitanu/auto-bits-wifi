const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const ping = require("ping");
const winston = require("winston");
require("winston-daily-rotate-file");

// Constants
const PING_INTERVAL = 10000; // 10 seconds
const ONE_DAY = 24 * 60 * 60 * 1000; // milliseconds in a day
const PACKET_SIZE = 64; // bytes for ping
const CONFIG_PATH = path.join(__dirname, "config.json"); // Path to config file

// Tracking variables
let totalPings = 0;
let totalDataConsumed = 0;
let failedPingCount = 0; // Track consecutive ping failures

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: "combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
});
// Set up winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp((format = "YYYY-MM-DD HH:mm:ss")),
    winston.format.printf(({ timestamp, level, message }) => {
      const localTime = new Date(timestamp).toLocaleString();
      return `${localTime} [${level}]: ${message}`;
    })
  ),

  transports: [fileRotateTransport],
  //transports: [
  //new winston.transports.File({
  //      filename: path.join(__dirname, "application.log"),
  //}),
  //],
});

// Function to read configuration
async function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(config);
    }
    throw new Error(
      "Configuration not found. Please provide your username and password in config.json."
    );
  } catch (error) {
    logger.error("Error reading config:", error);
    process.exit(1); // Exit if the config is not found
  }
}

// Function to check internet connectivity
async function checkInternetConnectivity() {
  try {
    const res = await ping.promise.probe("1.1.1.1");
    return res.alive;
  } catch (error) {
    logger.error("Error checking connectivity:", error);
    return false;
  }
}

// Function to perform login
async function performLogin(page, username, password) {
  try {
    if (!username || !password) {
      throw new Error("Username or password is undefined");
    }

    logger.info("Performing login with username:", username);

    await page.goto("http://172.16.0.30:8090/httpclient.html"); // Navigate to login page
    await page.fill("input#username", username);
    await page.fill("input#password", password);

    // Capture the old caption
    const oldCaption = await page.textContent("h1#signin-caption");

    await page.click("#loginbutton");
    await page.waitForTimeout(5000); // Wait for the login attempt to complete

    // Capture the new caption after login
    const newCaption = await page.textContent("h1#signin-caption");

    if (oldCaption !== newCaption) {
      logger.info("Login successful. New Caption:", newCaption);
    } else {
      const statusMessage = await page.evaluate(() => {
        const statusDiv = document.querySelector("#statusmessage");
        return statusDiv && statusDiv.className.includes("red")
          ? statusDiv.textContent
          : "No status message.";
      });
      logger.warn("Login failed. Status Message:", statusMessage);
    }
  } catch (error) {
    logger.error("Error performing login:", error);
  }
}

// Function to monitor connectivity and perform login if necessary
async function monitorConnectivity(page, username, password) {
  try {
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      failedPingCount++;
      logger.warn(`Ping failed. Consecutive failures: ${failedPingCount}`);

      if (failedPingCount >= 2) {
        logger.warn(
          "No internet connection detected for 2 consecutive pings. Performing login..."
        );
        await performLogin(page, username, password);
        failedPingCount = 0;
      }
    } else {
      logger.info("Internet connection is available.");
      failedPingCount = 0;
    }
  } catch (error) {
    logger.error("Error monitoring connectivity:", error);
  }
}

// Function to simulate periodic ping and calculate data usage
async function startPingMonitoring(page, username, password) {
  try {
    const startTime = Date.now();
    setInterval(async () => {
      try {
        await monitorConnectivity(page, username, password);

        totalPings++;
        totalDataConsumed = totalPings * PACKET_SIZE;

        if ((Date.now() - startTime) % (60 * 1000) === 0) {
          logger.info(
            `Total data consumed: ${(totalDataConsumed / (1024 * 1024)).toFixed(
              2
            )} MB`
          );
        }
      } catch (error) {
        logger.error("Error during ping monitoring:", error);
      }
    }, PING_INTERVAL);

    setTimeout(() => {
      logger.info("Stopping ping monitoring after one day.");
      process.exit(0);
    }, ONE_DAY);
  } catch (error) {
    logger.error("Error starting ping monitoring:", error);
  }
}

// Start monitoring (triggered from Electron main process)
module.exports = async function startLoginMonitoring() {
  try {
    const config = await readConfig();
    const { username, password } = config;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await startPingMonitoring(page, username, password);
  } catch (error) {
    logger.error("Unexpected error:", error);
    process.exit(1);
  }
};
