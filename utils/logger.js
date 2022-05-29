require("winston-daily-rotate-file");

const { createLogger, format, transports } = require("winston");
const path = require("path");

const logLevel = "debug";

const { combine, timestamp, printf } = format;

const myFormat = printf((info) => {
  if (info instanceof Error) {
    return `${info.timestamp} ${info.level}: ${info.message} ${info.stack}`;
  }
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

module.exports = createLogger({
  level: logLevel,
  format: combine(
    format.splat(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    myFormat
  ),
  transports: [
    new transports.DailyRotateFile({
      filename: "logs/server-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: logLevel,
    }),
  ],
});
