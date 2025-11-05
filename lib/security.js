const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os'); // Required for temp directory

/**
 * @class Security
 * @description Manages security aspects like secret handling, authentication, and payload signing.
 */
class Security {
  constructor(options, logger) {
    this.logger = logger;
    this.config = options;
    this.secret = this._loadSecret();
  }

  /**
   * Loads the shared secret with the following priority:
   * 1. EXPRESS_DISCOVERY_KEY environment variable.
   * 2. An existing '_express_micro_discovery_key' file in the OS temp directory.
   * 3. Creates a new key file in the OS temp directory if none exists.
   * @private
   */
  _loadSecret() {
    // 1. Highest Priority: Check for Environment Variable
    const envSecret = process.env.EXPRESS_DISCOVERY_KEY;
    if (envSecret) {
      this.logger.info('Loaded discovery secret from EXPRESS_DISCOVERY_KEY environment variable.');
      return envSecret;
    }

    // 2. Second Priority: Check for a key file in the OS temp directory
    const tempDir = os.tmpdir();
    const secretPath = path.join(tempDir, '_express_micro_discovery_key');

    if (fs.existsSync(secretPath)) {
      this.logger.info(`Loaded discovery secret from temporary file: ${secretPath}`);
      return fs.readFileSync(secretPath, 'utf8').trim();
    }

    // 3. Fallback: Generate a new secret and save it to the temp directory
    try {
      this.logger.info(`No secret found. Generating a new secret and saving to ${secretPath}`);
      const newSecret = crypto.randomUUID();
      fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
      return newSecret;
    } catch (err) {
      this.logger.error(`Failed to write new secret file to ${secretPath}: ${err.message}`);
      // In this case, we cannot proceed without a secret.
      throw new Error(`ExpressMicro Discovery: Could not create or access the secret key at ${secretPath}. Please check permissions.`);
    }
  }

  /**
   * Creates an Express middleware to protect discovery endpoints.
   */
  authMiddleware() {
    return (req, res, next) => {
      // IP Whitelist Check
      if (this.config.ipWhitelist && this.config.ipWhitelist.length > 0) {
        if (!this.config.ipWhitelist.includes(req.ip)) {
          this.logger.warn(`Rejected request from non-whitelisted IP: ${req.ip}`);
          return res.status(403).send({ error: 'Forbidden: IP not whitelisted' });
        }
      }

      // Shared Secret Token Check
      const token = req.headers.authorization?.split(' ')[1];
      if (!token || token !== this.secret) {
        this.logger.warn('Rejected request with invalid or missing discovery token.');
        return res.status(401).send({ error: 'Unauthorized' });
      }

      next();
    };
  }
  
  /**
   * Signs a payload using HMAC-SHA256.
   * @param {string} payload - The JSON string payload to sign.
   * @returns {string} The HMAC signature.
   */
  sign(payload) {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  /**
   * Verifies an HMAC signature.
   * @param {string} payload - The JSON string payload.
   * @param {string} signature - The signature to verify.
   * @returns {boolean} True if the signature is valid.
   */
  verify(payload, signature) {
    const expectedSignature = this.sign(payload);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

module.exports = Security;