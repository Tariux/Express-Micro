const axios = require('axios');

/**
 * @class ServiceClient
 * @description Provides a developer-friendly proxy to interact with remote services.
 */
class ServiceClient {
  constructor(registry, security, logger) {
    this.registry = registry;
    this.security = security;
    this.logger = logger;
    this.enableHmac = security.config.enableHmac || false;

    return new Proxy({}, {
      get: (target, serviceName) => {
        return this._createServiceProxy(serviceName);
      },
    });
  }

  _createServiceProxy(serviceName) {
    return new Proxy({}, {
      get: (target, routeName) => {
        return async (args) => {
          const service = this.registry.getService(serviceName);

          if (!service || service.status !== 'UP') {
            this.logger.error(`Service '${serviceName}' is unavailable.`);
            throw new Error(`Service Unavailable: ${serviceName}`);
          }
          
          // Find the route by matching the function name in the stack
          const route = service.routes.find(r => r.stack && r.stack[0] && r.stack[0].name === routeName);
          if (!route) {
            this.logger.error(`Route '${routeName}' not found on service '${serviceName}'.`);
            throw new Error(`Route Not Found: ${routeName} on ${serviceName}`);
          }

          let finalPath = route.path;
          const bodyArgs = { ...(args || {}) };

          if (args) {
            Object.keys(args).forEach(key => {
              const placeholder = `:${key}`;
              if (finalPath.includes(placeholder)) {
                finalPath = finalPath.replace(placeholder, encodeURIComponent(args[key]));
                delete bodyArgs[key]; 
              }
            });
          }
          
          return this._makeRequest(service, { ...route, path: finalPath }, bodyArgs);
        };
      },
    });
  }

  async _makeRequest(service, route, args) {
    const url = `${service.url}${route.path}`;
    const headers = { 'Content-Type': 'application/json' };
    
    const method = Object.keys(route.methods)[0].toLowerCase();
    
    const requestConfig = { method, url, headers };
    
    if (method === 'get' || method === 'delete') {
      requestConfig.params = args;
    } else {
      requestConfig.data = args;
    }

    if (this.enableHmac && requestConfig.data) {
      const payload = JSON.stringify(requestConfig.data);
      headers['X-ExpressMicro-Signature'] = this.security.sign(payload);
    }
    
    try {
      const response = await axios(requestConfig);
      return response.data;
    } catch (error) {
      this.logger.error(`Error calling ${method.toUpperCase()} ${url}: ${error.message}`);
      this.registry._markAsDown(service.name, service, error.message);
      throw error;
    }
  }
}

module.exports = ServiceClient;