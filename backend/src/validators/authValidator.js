const Joi = require('joi');

// Validation schema for user registration
const registerSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string().min(6).max(100).required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must be less than 100 characters',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// Validation schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema
};

