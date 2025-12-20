const rateLimit = require('express-rate-limit');

// 1. General Limiter (Applies to all routes)
// Allow 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: "Too many requests from this IP, please try again later."
});

// 2. Strict Limiter (For Login/Register)
// Allow only 10 attempts per hour (Stops Brute Force)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 10, 
    message: "Too many login attempts. Please try again in an hour."
});

module.exports = { globalLimiter, authLimiter };