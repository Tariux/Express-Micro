/**
 * @class Logger
 * @description A simple console logger with levels for standardized output.
 */
class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  /**
   * Internal logging method.
   * @private
   * @param {string} level - Log level (info, warn, error).
   * @param {string} message - Log message.
   * @param {*} meta - Additional metadata.
   */
  _log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}`;
    console.log(formattedMessage, meta || '');
  }

  /**
   * Logs an info message.
   * @param {string} message - The message to log.
   * @param {*} meta - Optional metadata.
   */
  info(message, meta) {
    this._log('info', message, meta);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The message to log.
   * @param {*} meta - Optional metadata.
   */
  warn(message, meta) {
    this._log('warn', message, meta);
  }

  /**
   * Logs an error message.
   * @param {string} message - The message to log.
   * @param {*} meta - Optional metadata.
   */
  error(message, meta) {
    this._log('error', message, meta);
  }
}

module.exports = Logger;