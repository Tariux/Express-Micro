const path = require('path');
const Security = require('./lib/security');
const Logger = require('./lib/logger');
const RouteScanner = require('./lib/scanner');
const ServiceRegistry = require('./lib/registry');
const EndpointManager = require('./lib/endpoints');
const ServiceClient = require('./lib/client');
const NetworkUtils = require('./lib/network');

/**
 * Initializes the ExpressMicro Discovery plugin.
 * @param {object} app - The Express application instance.
 * @param {object} options - Configuration options for the plugin.
 * @returns {object} An object containing the services client API.
 */
function expressMicro(app, options = {}) {
  // 1. Basic configuration setup
  const serviceName = options.serviceName || process.env.npm_package_name || 'unnamed-service';
  const port = options.port || app.get('port');
  if (!port) {
    throw new Error('ExpressMicro Discovery: Port is not defined. Ensure app.listen has been called or configure the port option.');
  }
  const host = options.host || NetworkUtils.getLocalIpAddress() || '127.0.0.1';
  
  const config = { ...options, serviceName, port, host };
  
  // 2. Initialize core modules
  const logger = new Logger(serviceName);
  const security = new Security(config, logger);
  const registry = new ServiceRegistry(config, logger, security);

  // 3. Create a metadata object that will be populated later.
  // We pass this by reference to the EndpointManager so it has access to it once it's populated.
  const selfMetadata = {
    name: serviceName,
    url: `http://${host}:${port}`,
    routes: [], // Routes will be populated in the deferred step below
  };

  // 4. Set up internal endpoints SYNCHRONOUSLY so the service can respond immediately.
  const endpointManager = new EndpointManager(app, security, registry, selfMetadata);
  endpointManager.createEndpoints();

  // 5. DEFER route scanning and peer discovery.
  // This is the critical fix. It pushes this logic to the end of the event loop,
  // allowing the host application to finish defining all its routes before we scan.
  setTimeout(() => {
    // Now we scan for routes
    const discoveredRoutes = RouteScanner.scan(app);
    
    selfMetadata.routes = discoveredRoutes; // Update the object that EndpointManager has a reference to
    logger.info(`Discovered ${Object.keys(discoveredRoutes).length} routes for this service.`);

    // And now we can discover peers, sending them our complete metadata
    registry.discoverPeers(selfMetadata).then(() => {
      logger.info('Initial peer discovery complete.');
      registry.startPinging();
    });
  }, 0);

  // 6. Create and return the service client immediately
  const services = new ServiceClient(registry, security, logger);
  
  return { services };
}

module.exports = expressMicro;