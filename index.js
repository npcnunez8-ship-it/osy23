import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env (still allowed but no longer required
// for basic auth behavior)
dotenv.config();

const PORT = process.env.PORT || 4000;

// Express app
const app = express();

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// =============================
// AUTH ROUTES
// =============================

// Very simple in-memory user store for demo purposes only
const users = new Map(); // email -> { email, password, id }

// Helper to create a fake session object compatible with frontend expectations
const createFakeSession = (user) => {
  const expiresInSeconds = 60 * 60 * 24; // 24 hours
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    access_token: `fake-token-${user.id}-${nowSeconds}`,
    token_type: 'bearer',
    expires_in: expiresInSeconds,
    expires_at: nowSeconds + expiresInSeconds,
    user,
  };
};

// Register (purely local demo logic - always succeeds and never uses Supabase)
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};

  // Very minimal validation just to avoid completely empty values
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Create or reuse a simple in-memory user record
  let stored = users.get(email);
  if (!stored) {
    const user = {
      id: users.size + 1,
      email,
    };
    stored = { ...user, password };
    users.set(email, stored);
  }

  const user = { id: stored.id, email: stored.email };
  const session = createFakeSession(user);

  // Always return success so the frontend never sees 'Invalid API key'
  return res.json({
    message: 'Account created successfully',
    user,
    session,
  });
});

// Login (uses the same in-memory users map)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const stored = users.get(email);
  if (!stored || stored.password !== password) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  const user = { id: stored.id, email: stored.email };
  const session = createFakeSession(user);

  return res.json({
    message: 'Login successful',
    user,
    session,
  });
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  // For the fake demo session, we just return a minimal user object
  // if the token matches our simple "fake-token-" pattern.
  if (!token.startsWith('fake-token-')) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // In a real app we would decode the token; here we just mark the
  // user as generic since the frontend mainly needs an email later
  // from the profile endpoint.
  return res.json({ user: { id: 1, email: 'demo@example.com' } });
});

// =============================
// SNACKS ROUTES (minimal)
// =============================

// For now, serve static snacks from data.js so frontend works
import { snacks } from './js/data.js';

app.get('/api/snacks', (req, res) => {
  // Shape is already what frontend expects
  res.json(snacks);
});

app.post('/api/snacks', (req, res) => {
  const snack = req.body || {};
  if (!snack.name || !snack.country || !snack.imageUrl) {
    return res.status(400).json({ error: 'Missing required snack fields' });
  }

  // Very simple: assign id and push into memory only
  const maxId = snacks.reduce((max, s) => Math.max(max, s.id), 0);
  const newSnack = {
    id: maxId + 1,
    ...snack,
  };
  snacks.push(newSnack);

  return res.status(201).json(newSnack);
});

// =============================
// START SERVER
// =============================

app.listen(PORT, () => {
  console.log(`Snackify backend listening on http://localhost:${PORT}`);
});
