# Express Micro

A lightweight Express.js plugin for automatic service discovery and inter-service communication in microservice architectures.

## Features

- **Automatic Service Discovery**: Services automatically discover and register with each other
- **Secure Communication**: Built-in authentication and optional HMAC signing for requests
- **Health Monitoring**: Continuous health checks and automatic service status updates
- **Easy Integration**: Simple proxy-based API for calling remote services
- **IP Whitelisting**: Optional IP-based access control for discovery endpoints
- **Dual Module Support**: Compatible with both CommonJS and ES6 modules

## Installation

```bash
npm install express-micro
```

## Quick Start

### Basic Setup

```javascript
const express = require('express');
const expressMicro = require('express-micro');

const app = express();
app.use(express.json());

// Define your routes
app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'John Doe' });
});

app.post('/api/users', (req, res) => {
  res.json({ id: 1, ...req.body });
});

// Initialize Express Micro
const { services } = expressMicro(app, {
  serviceName: 'user-service',
  port: 3000,
  peers: ['http://localhost:3001'] // URLs of other services
});

app.listen(3000, () => {
  console.log('User service running on port 3000');
});
```

### Using ES6 Modules

```javascript
import express from 'express';
import expressMicro from 'express-micro';

const app = express();
// ... setup routes ...

const { services } = expressMicro(app, {
  serviceName: 'user-service',
  port: 3000
});

// ... start server ...
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceName` | string | `npm_package_name` or `'unnamed-service'` | Name of the service |
| `port` | number | `app.get('port')` | Port the service runs on |
| `host` | string | Auto-detected IP or `'127.0.0.1'` | Host address |
| `peers` | string[] | `[]` | Initial list of peer service URLs |
| `pingInterval` | number | `5000` | Health check interval in milliseconds |
| `ipWhitelist` | string[] | `undefined` | Allowed IPs for discovery endpoints |
| `enableHmac` | boolean | `false` | Enable HMAC signing for requests |

## API Usage

### Calling Remote Services

Once services are discovered, you can call them using the `services` proxy:

```javascript
// Assuming there's an 'order-service' with a route: app.get('/orders/:userId', ...)
const orders = await services.orderService.getOrders({ userId: 123 });

// For POST requests
const newOrder = await services.orderService.createOrder({
  userId: 123,
  items: ['item1', 'item2']
});
```

The proxy automatically:
- Maps function names to route handlers
- Handles URL parameter substitution
- Manages HTTP methods (GET, POST, PUT, DELETE)
- Provides error handling

## Security Features

### Authentication

All discovery endpoints require a shared secret token:

```bash
curl -H "Authorization: Bearer YOUR_SECRET" \
     http://localhost:3000/_discovery/services
```

The secret is automatically generated and stored in the system's temp directory, or can be set via the `EXPRESS_DISCOVERY_KEY` environment variable.

### IP Whitelisting

Restrict access to discovery endpoints:

```javascript
const { services } = expressMicro(app, {
  ipWhitelist: ['192.168.1.100', '10.0.0.1']
});
```

### HMAC Signing

Enable request signing for additional security:

```javascript
const { services } = expressMicro(app, {
  enableHmac: true
});
```

## Discovery Endpoints

### GET /_discovery/services

Returns information about this service and connected peers.

**Response:**
```json
{
  "thisService": {
    "name": "user-service",
    "url": "http://192.168.1.100:3000",
    "routes": [...]
  },
  "connectedPeers": {
    "order-service": {
      "url": "http://192.168.1.100:3001",
      "routes": [...],
      "status": "UP"
    }
  }
}
```

### POST /_discovery/register

Used by services to register themselves. Requires authentication.

### POST /_discovery/ping

Health check endpoint. Requires authentication.

## Examples

### Multi-Service Setup

**User Service (Port 3000):**
```javascript
const express = require('express');
const expressMicro = require('express-micro');

const app = express();
app.use(express.json());

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'User ' + req.params.id });
});

const { services } = expressMicro(app, {
  serviceName: 'user-service',
  port: 3000,
  peers: ['http://localhost:3001']
});

app.listen(3000);
```

**Order Service (Port 3001):**
```javascript
const express = require('express');
const expressMicro = require('express-micro');

const app = express();
app.use(express.json());

app.get('/orders/:userId', (req, res) => {
  res.json({ userId: req.params.userId, orders: [] });
});

const { services } = expressMicro(app, {
  serviceName: 'order-service',
  port: 3001,
  peers: ['http://localhost:3000']
});

// Call user service
app.get('/user-orders/:userId', async (req, res) => {
  try {
    const user = await services.userService.getUser({ id: req.params.userId });
    const orders = await services.orderService.getOrders({ userId: req.params.userId });
    res.json({ user, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001);
```

### Environment Variables

```bash
# Set discovery secret
export EXPRESS_DISCOVERY_KEY=your-secret-key

# Run services
node user-service.js &
node order-service.js &
```

## Security Notes

- **Shared Secret**: The discovery secret is stored in the system's temp directory with restricted permissions (0600). Never commit this file to version control.
- **Network Security**: Discovery endpoints should only be accessible within your internal network. Use firewalls or VPNs to restrict access.
- **IP Whitelisting**: Enable IP whitelisting in production to prevent unauthorized service registration.
- **HMAC Signing**: Enable HMAC for production deployments to ensure request integrity.
- **HTTPS**: Consider using HTTPS for all service communications in production.
- **Secret Rotation**: Regularly rotate the discovery secret and restart services.

## Troubleshooting

### Common Issues

1. **Port not defined**: Ensure `app.listen(port)` is called before initializing Express Micro, or provide the port in options.

2. **Services not discovering each other**: Check that peer URLs are correct and services are running. Verify network connectivity.

3. **Authentication failures**: Ensure the same secret is used across all services. Check the temp directory for the secret file.

4. **Route not found errors**: Verify that the remote service has the expected route and that the function name matches the route handler name.

### Debug Information

Check the discovery endpoint to see registered services:

```bash
curl -H "Authorization: Bearer YOUR_SECRET" \
     http://localhost:PORT/_discovery/services
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.