import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { SlidingWindowLogRateLimiter } from "../rate_limiter.service";

const redis = new Redis();

const authRateLimiter = new SlidingWindowLogRateLimiter(
  redis,
  15 * 60 * 1000, // 15 minutes window
  20              // max 20 attempts per IP
);

export async function limitAuthRequests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString() ||
      "unknown";

    const allowed = await authRateLimiter.isAllowed(ip);

    if (!allowed) {
      return res.status(429).json({
        error: "Too many authentication attempts. Please try again later.",
      });
    }

    next();
  } catch (err) {
    next();
  }
}
