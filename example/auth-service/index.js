const express = require('express');
const microXpressDiscovery = require('../../');

// --- 1. Create Express App ---
const app = express();
app.use(express.json());

const PORT = 6000;

// --- Mock Database ---
const users = {
  '101': { id: '101', name: 'Alice', email: 'alice@example.com' },
  '102': { id: '102', name: 'Bob', email: 'bob@example.com' },
};

// --- 2. Define Route Handlers ---
// We name the functions so the scanner can automatically create route names.
function getProfile(req, res) {
  const user = users[req.params.id];
  if (user) {
    console.log(`[Auth Service] Profile for user ${req.params.id} requested and found.`);
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
}

function loginUser(req, res) {
    const { email } = req.body;
    console.log(`[Auth Service] Login attempt for email: ${email}`);
    // Dummy login logic
    const user = Object.values(users).find(u => u.email === email);
    if (user) {
        res.json({ message: `Welcome ${user.name}`, userId: user.id });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
}


// --- 3. Define Express Routes ---
// These routes will be discovered by the plugin.
app.get('/profile/:id', getProfile);
app.post('/login', loginUser);


// --- 4. Initialize MicroXpress Discovery ---
// It's crucial to initialize this *after* all routes are defined.
microXpressDiscovery(app, {
  serviceName: 'auth-service', // Explicitly name our service
  port: PORT,
  peers: ['http://localhost:6001'], // The address of the order-service
  onServiceUp: (name) => console.log(`[Discovery] Event: Service '${name}' is UP.`),
  onServiceDown: (name) => console.log(`[Discovery] Event: Service '${name}' is DOWN.`),
});


// --- 5. Start the Server ---
app.listen(PORT, () => {
  console.log(`[Auth Service] running on http://localhost:${PORT}`);
});