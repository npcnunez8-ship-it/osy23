const { authDb } = require('../db/authDb');
const { asyncHandler } = require('../middleware/errorHandler');

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const profile = await authDb.getProfile(user.id);

  if (!profile) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    profile: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      profile_picture_url: profile.profile_picture_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { username, profile_picture_url } = req.body;

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (profile_picture_url !== undefined) updates.profile_picture_url = profile_picture_url || null;

  if (Object.keys(updates).length === 0) {
    const error = new Error('No fields to update');
    error.statusCode = 400;
    throw error;
  }

  const updatedProfile = await authDb.updateProfile(user.id, updates);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    profile: {
      id: updatedProfile.id,
      email: updatedProfile.email,
      username: updatedProfile.username,
      profile_picture_url: updatedProfile.profile_picture_url,
      updated_at: updatedProfile.updated_at
    }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const user = req.user;
  const { current_password, new_password } = req.body;

  // Verify current password by attempting to sign in
  try {
    await authDb.login(user.email, current_password);
  } catch (error) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }

  // Get access token from request
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Authorization token required');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.substring(7);
  
  // Update password using authDb which handles the token properly
  await authDb.updatePassword(token, new_password);

  res.json({
    success: true,
    message: 'Password updated successfully. Please login again with your new password.'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};

