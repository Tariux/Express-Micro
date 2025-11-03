const express = require('express');
const microXpressDiscovery = require('../../');

// --- 1. Create Express App ---
const app = express();
app.use(express.json());

const PORT = 6001;

// --- Mock Database ---
const orders = [];


// --- 2. Initialize MicroXpress Discovery ---
// We initialize this *before* defining routes that use the 'services' client.
const { services } = microXpressDiscovery(app, {
    serviceName: 'order-service',
    port: PORT,
    peers: ['http://localhost:6000'], // The address of the auth-service
});


// --- 3. Define Route Handlers ---
// This handler uses the discovery client to call the auth-service.
async function createOrder(req, res) {
    const { userId, product } = req.body;
    if (!userId || !product) {
        return res.status(400).json({ error: 'userId and product are required' });
    }

    try {
        console.log(`[Order Service] Received order for user ${userId}. Verifying user with auth-service...`);

        // Use the developer-friendly API to call the remote service
        const userProfile = await services.authService.getProfile({ id: userId });

        console.log(`[Order Service] User ${userProfile.name} verified successfully.`);

        const newOrder = {
            orderId: `ORD-${Date.now()}`,
            product,
            customerName: userProfile.name,
        };
        orders.push(newOrder);

        res.status(201).json(newOrder);

    } catch (error) {
        console.error(`[Order Service] Error creating order: ${error.message}`);
        if (error.message.includes('Service Unavailable')) {
            res.status(503).json({ error: 'Auth service is currently unavailable. Please try again later.' });
        } else if (error.message.includes('404')) {
             res.status(404).json({ error: 'User could not be found.' });
        } else {
            res.status(500).json({ error: 'An internal error occurred' });
        }
    }
}

// --- 4. Define Express Routes ---
app.post('/orders', createOrder);


// --- 5. Start the Server ---
app.listen(PORT, () => {
    console.log(`[Order Service] running on http://localhost:${PORT}`);
});