const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file'); // Import the daily rotate file transport
const path = require('path');
const os = require('os');

// Define the log directory in a user-specific path (AppData on Windows)
const logDirectory = path.join(os.homedir(), 'AppData', 'Local', 'VoucherApp', 'logs');

// Ensure the log directory exists
const fs = require('fs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a Winston logger
const logger = createLogger({
  level: 'info', // Default logging level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp in desired format
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`) // Customize log format
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDirectory, 'app-%DATE%.log'), // Log file path with dynamic directory
      datePattern: 'YYYY-MM-DD', // Rotate logs daily
      maxSize: '20m', // Maximum size of log files
      maxFiles: '14d', // Retain logs for 14 days
    }),
    new transports.Console(), // Log to the console
  ],
});

module.exports = logger;

