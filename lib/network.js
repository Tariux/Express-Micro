// microxpress-discovery/utils/network.js

const os = require('os');

/**
 * @class NetworkUtils
 * @description Provides network-related utility functions.
 */
class NetworkUtils {
  /**
   * Gets the first non-internal IPv4 address of the machine.
   * @returns {string | undefined} The local IPv4 address or undefined if not found.
   */
  static getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip over internal (i.e., 127.0.0.1) and non-ipv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
}

module.exports = NetworkUtils;