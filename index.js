import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message: 'Account created successfully',
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
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

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: error?.message || 'Invalid token' });
    }

    return res.json({ user: data.user });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
