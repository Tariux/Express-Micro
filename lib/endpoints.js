// microxpress-discovery/lib/endpoints.js

const express = require('express');

/**
 * @class EndpointManager
 * @description Manages the internal /_discovery endpoints for registration and health checks.
 */
class EndpointManager {
  constructor(app, security, registry, selfMetadata) {
    this.app = app;
    this.security = security;
    this.registry = registry;
    this.selfMetadata = selfMetadata;
  }

  /**
   * Creates and mounts the internal discovery routes.
   */
  createEndpoints() {
    const router = express.Router();
    router.use(express.json());

    // Apply security middleware to all /_discovery routes
    router.use(this.security.authMiddleware());

    // Endpoint for a new service to register itself
    router.post('/register', (req, res) => {
      const peerData = req.body;
      this.registry.register(peerData);
      // Respond with self metadata
      res.json(this.selfMetadata);
    });

    // Lightweight endpoint for health checks
    router.post('/ping', (req, res) => {
      res.status(200).send({ status: 'OK' });
    });

    // --- NEW DEBUG ENDPOINT ---
    // Endpoint for debugging to view the list of all known services.
    router.get('/services', (req, res) => {
      const allServices = {
        thisService: this.selfMetadata,
        connectedPeers: this.registry.getAllServices(),
      };
      res.json(allServices);
    });

    this.app.use('/_discovery', router);
  }
}

module.exports = EndpointManager;