/**
 * @class RouteScanner
 * @description Scans an Express app to discover its routes and handlers.
 */
class RouteScanner {
  /**
   * Extracts route metadata from an Express application instance.
   * @param {object} app - The Express app instance.
   * @returns {object} A key-value map of route metadata.
   */
  static scan(app) {
    const routes = [];
    const router = (app?._router?.stack) ? app._router : app.router;
    if (!app || !router || !router.stack) {
      return routes;
    }

    const processRoute = (route) => {
      const methods = {};
      Object.keys(route.methods).forEach(method => {
        if (route.methods[method]) {
          methods[method] = true;
        }
      });

      routes.push({
        path: route.path,
        stack: route.stack,
        methods: methods
      });
    };

    router.stack.forEach((middleware) => {
      if (middleware.route) {
        processRoute(middleware.route);
      }
    });

    return routes;
  }

}

module.exports = RouteScanner;