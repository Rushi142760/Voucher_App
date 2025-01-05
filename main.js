const { app, BrowserWindow, screen, Menu } = require('electron');
const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const asar = require('asar'); // Add asar module for unpacking

let mainWindow;
let backendProcess;

// Log Directory Setup
const logDirectory = path.join(os.homedir(), 'AppData', 'Local', 'VoucherApp', 'logs');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });

const logFilePath = path.join(logDirectory, 'app.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Custom Console Logging to File
console.log = (...args) => {
  const message = `[${new Date().toISOString()}] INFO: ${args.join(' ')}\n`;
  logStream.write(message);
  process.stdout.write(message);
};

console.error = (...args) => {
  const message = `[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`;
  logStream.write(message);
  process.stderr.write(message);
};

// Function to Terminate Backend Process
const killBackendProcess = () => {
  if (backendProcess && backendProcess.pid) {
    console.log(`Terminating backend process with PID: ${backendProcess.pid}`);
    try {
      backendProcess.kill('SIGTERM');
      console.log('Backend process terminated.');
    } catch (error) {
      console.error(`Error terminating backend process: ${error.message}`);
    }
  }

  const portKillCommand =
    os.platform() === 'win32'
      ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :8082') do taskkill /F /PID %a`
      : `lsof -t -i :8082 | xargs kill -9`;

  try {
    execSync(portKillCommand);
    console.log('Successfully killed any process holding port 8082.');
  } catch (error) {
    console.error(`Error killing process on port 8082: ${error.message}`);
  }
};

// Check Java Installation
const checkJava = (callback) => {
  console.log('Checking Java installation...');
  exec('java -version', (err, stdout, stderr) => {
    if (err) {
      console.error('Java not found. Installing JDK...');
      installJava(callback);
    } else {
      const versionMatch = stderr.match(/version "(.*?)"/);
      if (versionMatch && versionMatch[1].startsWith('17')) {
        console.log('Compatible Java version found.');
        callback();
      } else {
        console.error('Incompatible Java version. Installing JDK...');
        installJava(callback);
      }
    }
  });
};

// Install Java if Missing
const installJava = (callback) => {
  const installerPath = path.join(process.resourcesPath, 'jdk-installer.exe');
  console.log(`Running JDK installer from: ${installerPath}`);

  const child = spawn(installerPath, ['/s'], { detached: true, stdio: 'ignore' });
  child.on('error', (error) => {
    console.error(`Error executing JDK installer: ${error.message}`);
    app.quit();
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('JDK installation completed. Please restart the app.');
      app.quit();
    } else {
      console.error(`JDK installer exited with code: ${code}`);
      app.quit();
    }
  });
};

// Get Backend JAR Path (handle both development and packaged environments)
const getBackendJarPath = () => {
  const isPackaged = app.isPackaged; // Check if the app is packaged
  const extractedJarDir = path.join(os.tmpdir(), 'voucherAppTemp'); // Temp directory
  const tempJarPath = path.join(extractedJarDir, 'voucher-app-springboot.jar');

  // Ensure the temp directory exists
  if (!fs.existsSync(extractedJarDir)) {
    fs.mkdirSync(extractedJarDir, { recursive: true });
  }

  if (isPackaged) {
    // In packaged mode, locate the JAR in resources/backend
    const jarPathInResources = path.join(process.resourcesPath, 'backend', 'voucher-app-springboot.jar');

    // Copy the JAR to the temp directory if not already present
    if (!fs.existsSync(tempJarPath)) {
      try {
        console.log(`Copying JAR from ${jarPathInResources} to ${tempJarPath}`);
        fs.copyFileSync(jarPathInResources, tempJarPath);
      } catch (error) {
        console.error(`Failed to copy JAR file: ${error.message}`);
        app.quit();
      }
    }

    return tempJarPath;
  } else {
    // In development mode, use the JAR file directly from the project directory
    return path.join(__dirname, 'backend', 'voucher-app-springboot.jar');
  }
};


// Start Backend Process
const startBackend = () => {
  const jarPath = getBackendJarPath();
  console.log(`Starting backend from: ${jarPath}`);

  // Check if JAR file exists
  if (!fs.existsSync(jarPath)) {
    console.error(`Backend JAR file not found at: ${jarPath}. Exiting...`);
    app.quit();
    return;
  }

  // Kill any process occupying port 8082
  const portKillCommand =
    os.platform() === 'win32'
      ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :8082') do taskkill /F /PID %a`
      : `lsof -t -i :8082 | xargs kill -9`;

  try {
    console.log('Checking and killing any process on port 8082...');
    execSync(portKillCommand);
    console.log('Successfully killed any process holding port 8082.');
  } catch (error) {
    console.error(`No process found on port 8082 or failed to kill: ${error.message}`);
  }

  // Start the backend process
  backendProcess = spawn('java', ['-jar', jarPath]);

  backendProcess.stdout.on('data', (data) => console.log(`Backend stdout: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`Backend stderr: ${data}`));

  backendProcess.on('error', (err) => {
    console.error(`Failed to start backend: ${err.message}`);
    app.quit();
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code: ${code}`);
    if (code !== 0) {
      console.error('Backend failed. Exiting app...');
      app.quit();
    }
  });
};


// Create Main Application Window
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile('./renderer/index.html');

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.openDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Application Lifecycle Events
app.on('ready', () => {
  console.log('App is ready. Initializing...');
  checkJava(() => {
    startBackend();
    createWindow();
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed. Cleaning up...');
  killBackendProcess();
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
