const Joi = require('joi');

// Validation schema for updating profile
const updateProfileSchema = Joi.object({
  username: Joi.string().trim().min(2).max(100).optional()
    .messages({
      'string.min': 'Username must be at least 2 characters',
      'string.max': 'Username must be less than 100 characters'
    }),
  
  profile_picture_url: Joi.string().uri().trim().optional()
    .allow('')
    .messages({
      'string.uri': 'Profile picture URL must be a valid URL'
    })
});

// Validation schema for changing password
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  
  new_password: Joi.string().min(6).max(100).required()
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'string.max': 'New password must be less than 100 characters',
      'string.empty': 'New password is required',
      'any.required': 'New password is required'
    }),
  
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password'
    })
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema
};

