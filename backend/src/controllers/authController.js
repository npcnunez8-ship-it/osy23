const { authDb } = require('../db/authDb');
const { asyncHandler } = require('../middleware/errorHandler');

// Register a new user
const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authDb.register(email, password);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email
      },
      session: {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
        expires_at: result.session.expires_at
      }
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authDb.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email
      },
      session: {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
        expires_at: result.session.expires_at
      }
    });
  } catch (error) {
    // Handle invalid credentials
    if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    throw error;
  }
});

// Get current user (verify session)
const getCurrentUser = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('No authorization token provided');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.substring(7);
  const user = await authDb.getUserByToken(token);
  const profile = await authDb.getProfile(user.id);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: profile?.username || null,
      profile_picture_url: profile?.profile_picture_url || null,
      ...profile
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  // Note: Supabase logout is typically done client-side
  // This endpoint is for server-side session cleanup if needed
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};

