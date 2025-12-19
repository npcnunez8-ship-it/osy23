const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/profileController');
const { validate } = require('../middleware/validation');
const { updateProfileSchema, changePasswordSchema } = require('../validators/profileValidator');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getProfile);
router.put('/', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;

