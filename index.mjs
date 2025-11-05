import path from 'path';
import { fileURLToPath } from 'url';
import Security from './lib/security.js';
import Logger from './lib/logger.js';
import RouteScanner from './lib/scanner.js';
import ServiceRegistry from './lib/registry.js';
import EndpointManager from './lib/endpoints.js';
import ServiceClient from './lib/client.js';
import NetworkUtils from './lib/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the ExpressMicro Discovery plugin.
 * @param {object} app - The Express application instance.
 * @param {object} options - Configuration options for the plugin.
 * @returns {object} An object containing the services client API.
 */
function expressMicro(app, options = {}) {
  const serviceName = options.serviceName || process.env.npm_package_name || 'unnamed-service';
  const port = options.port || app.get('port');
  if (!port) {
    throw new Error('ExpressMicro Discovery: Port is not defined. Ensure app.listen has been called or configure the port option.');
  }
  const host = options.host || NetworkUtils.getLocalIpAddress() || '127.0.0.1';

  const config = { ...options, serviceName, port, host };

  const logger = new Logger(serviceName);
  const security = new Security(config, logger);
  const registry = new ServiceRegistry(config, logger, security);

  const selfMetadata = {
    name: serviceName,
    url: `http://${host}:${port}`,
    routes: [],
  };

  const endpointManager = new EndpointManager(app, security, registry, selfMetadata);
  endpointManager.createEndpoints();

  setTimeout(() => {
    const discoveredRoutes = RouteScanner.scan(app);

    selfMetadata.routes = discoveredRoutes;
    registry.discoverPeers(selfMetadata).then(() => {
      registry.startPinging();
    });
  }, 0);

  const services = new ServiceClient(registry, security, logger);

  return { services };
}

export default expressMicro;