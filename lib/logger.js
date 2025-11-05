/**
 * @class Logger
 * @description A simple console logger with levels for standardized output.
 */
class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  _log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}`;
    console.log(formattedMessage, meta || '');
  }

  info(message, meta) {
    this._log('info', message, meta);
  }

  warn(message, meta) {
    this._log('warn', message, meta);
  }

  error(message, meta) {
    this._log('error', message, meta);
  }
}

module.exports = Logger;