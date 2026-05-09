// rateLimiter.ts — Protects against abuse and DDoS.
//
// Rate limiting tracks how many requests an IP address makes
// in a time window and blocks them if they exceed the limit.
//
// Two limiters:
//   - general: 100 requests per 15 minutes (all routes)
//   - strict: 20 requests per 15 minutes (write operations)

import rateLimit from "express-rate-limit";

// General limiter — applied to all API routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // max requests per window per IP
  standardHeaders: true,     // Return rate limit info in headers (RateLimit-*)
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
});

// Strict limiter — for write operations (POST, PUT, PATCH, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many write requests, please slow down",
  },
});