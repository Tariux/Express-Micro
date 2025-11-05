const axios = require('axios');

/**
 * @class ServiceRegistry
 * @description Manages the list of peer services, their routes, and their availability.
 */
class ServiceRegistry {
  constructor(options, logger, security) {
    this.serviceName = options.serviceName;
    this.serviceUrl = `http://${options.host}:${options.port}`;
    this.peers = new Map(); // Store peer data: { name: { url, routes, status } }
    this.initialPeers = options.peers || [];
    this.pingInterval = options.pingInterval || 5000;
    this.logger = logger;
    this.security = security;
    this.onServiceUp = options.onServiceUp || (() => {});
    this.onServiceDown = options.onServiceDown || (() => {});
  }

  /**
   * Starts the periodic health check process.
   */
  startPinging() {
    setInterval(() => this._healthCheck(), this.pingInterval);
  }

  /**
   * Registers or updates a service in the registry.
   * @param {object} serviceData - { name, url, routes }
   */
  register(serviceData) {
    const { name, url, routes } = serviceData;
    if (name === this.serviceName) return; // Don't register self

    const existingPeer = this.peers.get(name);
    if (!existingPeer) {
      this.logger.info(`New service discovered: ${name} at ${url}`);
      this.onServiceUp(name, { url, routes });
    } else if (existingPeer.status === 'DOWN') {
        this.logger.info(`Service has come back online: ${name}`);
        this.onServiceUp(name, { url, routes });
    }

    this.peers.set(name, { url, routes, status: 'UP' });
  }

  /**
   * Fetches metadata from all initial seed peers.
   */
  async discoverPeers(selfMetadata) {
    for (const peerUrl of this.initialPeers) {
      try {
        const response = await axios.post(`${peerUrl}/_discovery/register`, selfMetadata, {
          headers: {
            'Authorization': `Bearer ${this.security.secret}`,
          },
        });
        const peerData = response.data;
        this.register(peerData);
      } catch (error) {
        const reason = error.response ? `status ${error.response.status}` : error.message;
        this.logger.warn(`Failed to register with peer ${peerUrl}: ${reason} ${error.message}`);
      }
    }
  }

  /**
   * Periodically pings all known services to check their health.
   * @private
   */
  async _healthCheck() {
    for (const [name, peer] of this.peers.entries()) {
      try {
        await axios.post(`${peer.url}/_discovery/ping`, null, {
            headers: { 'Authorization': `Bearer ${this.security.secret}` },
            timeout: 2000 // Add a timeout to prevent long hangs
        });

        if (peer.status !== 'UP') {
          this.logger.info(`Service ${name} is now UP.`);
          peer.status = 'UP';
          this.onServiceUp(name, peer);
        }
      } catch (error) {
        if (peer.status !== 'DOWN') {
            this._markAsDown(name, peer, error.message);
        }
      }
    }
  }

  _markAsDown(name, peer, reason = 'Ping failed') {
     this.logger.warn(`Service ${name} is now DOWN. Reason: ${reason}`);
     peer.status = 'DOWN';
     this.onServiceDown(name, peer);
  }

  getService(name) {
    return this.peers.get(name);
  }

  getAllServices() {
    return Object.fromEntries(this.peers);
  }
}

module.exports = ServiceRegistry;

