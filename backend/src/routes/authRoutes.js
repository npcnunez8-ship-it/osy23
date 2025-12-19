const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  logout
} = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

module.exports = router;

