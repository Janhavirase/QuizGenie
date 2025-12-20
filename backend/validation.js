// backend/validation.js
const Joi = require('joi');

// 1. REGISTER VALIDATION
const registerSchema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name should be at least 3 characters'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters'
    })
});

// 2. LOGIN VALIDATION
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// 3. AI GENERATION VALIDATION (Protects your API Key cost)
const aiGenerateSchema = Joi.object({
    topic: Joi.string().min(3).max(100).required().messages({
        'string.empty': 'Topic cannot be empty',
        'string.max': 'Topic is too long (max 100 chars)'
    }),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    count: Joi.number().integer().min(1).max(20).default(5)
});

// 4. MANUAL QUIZ SAVING (Prevents "Invisible Questions")
const quizSchema = Joi.object({
    title: Joi.string().min(3).required(),
    questions: Joi.array().items(
        Joi.object({
            question: Joi.string().required(),
            options: Joi.array().items(Joi.string()).min(2).required(),
            answer: Joi.string().required()
        }).unknown(true)
    ).min(1).required()
});

module.exports = { 
    registerSchema, 
    loginSchema, 
    aiGenerateSchema, 
    quizSchema 
};