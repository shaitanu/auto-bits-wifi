const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const fs = require("fs");
const path = require("path");
const startLoginMonitoring = require("./login"); // Import the login monitoring script

let tray = null;
const CONFIG_PATH = path.join(__dirname, "config.json");

// Create Tray Icon and Menu
function createTray() {
  tray = new Tray(path.join(__dirname, "assets", "icon.png")); // Add a tray icon

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Change Credentials",
      click: async () => {
        // Open the window to change credentials
        createWindow();
      },
    },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setToolTip("Auto-Login Monitor");
  tray.setContextMenu(contextMenu);
}

// Function to write configuration
async function writeConfig(username, password) {
  try {
    // Ensure directory exists
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write config
    const config = { username, password };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error writing config:", error);
  }
}

// Function to create a new window for updating credentials
function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

// Handle save-credentials IPC message
ipcMain.on("save-credentials", async (event, { username, password }) => {
  try {
    await writeConfig(username, password);
    event.reply("credentials-saved", "Credentials saved successfully.");
  } catch (error) {
    event.reply("credentials-saved", "Error saving credentials.");
  }
});

// When Electron App is Ready
app.whenReady().then(async () => {
  createTray();

  // Check if config exists
  if (!fs.existsSync(CONFIG_PATH)) {
    try {
      // Open the window to get credentials if config file doesn't exist
      createWindow();
    } catch (error) {
      console.error(error);
      app.quit();
      return;
    }
  } else {
    // Start the login monitoring script
    startLoginMonitoring();
  }
});

// Quit when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Re-open the window if the app is activated and there are no windows
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
