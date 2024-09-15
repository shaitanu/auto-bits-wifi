# Auto Bits Login Application

## Overview

This Electron application automates the login process for Bits-WIFI Hyderabad. It runs in the system tray and manages credentials securely.

## Features

- **Auto Login**: Automatically attempts to log in to Auto Bits.
- **System Tray**: Runs in the system tray for easy access.
- **Credential Management**: If `config.json` does not exist, the application will prompt you to enter your credentials.
- **Change Credentials**: You can update your credentials anytime via the system tray icon.

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/shaitanu/auto-bits-wifi.git
   cd auto-bits-wifi
   ```

2. **Install Dependencies: Ensure you have Node.js installed. Then run:**

    ```bash
    npm install
    npx playwright install
    ```
3. **Run the Application: Start the application using:**

    ```bash
    npm start
    ```
4. **Initial Setup:**

- If config.json is not found, the application will prompt you to enter your credentials.
- Enter your username and password in the popup window.
- Save the credentials and the window will minimize.

5. **Change Credentials:**

- Right-click on the system tray icon.
- Select "Change Credentials" from the context menu.
- Enter your new credentials and save them.

6. **Logs:**

- The application logs its activity in ===application.log=== for troubleshooting.
  
## Usage
- The application will run in the system tray.
- You can interact with it via the tray icon.

## Notes
- Ensure config.json is added to .gitignore to keep your credentials secure.
- The node_modules directory is not included in the repository to save space and reduce clutter.
  
