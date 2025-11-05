const express = require('express');
const cors = require('cors');
const expressMicro = require('../../');

// --- 1. Create Express App ---
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 7002;

// --- Mock Database ---
const orders = [];


// --- 2. Initialize ExpressMicro Discovery ---
// We initialize this *before* defining routes that use the 'services' client.
const { services } = expressMicro(app, {
    host: 'localhost',
    serviceName: 'orderService',
    port: PORT,
    peers: ['http://localhost:7001'], // The address of the authService
});


// --- 3. Define Route Handlers ---
// This handler uses the discovery client to call the authService.
async function createOrder(req, res) {
    const { userId, product } = req.body;
    if (!userId || !product) {
        return res.status(400).json({ error: 'userId and product are required' });
    }

    try {
        console.log(`[Order Service] Received order for user ${userId}. Verifying user with authService...`);

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