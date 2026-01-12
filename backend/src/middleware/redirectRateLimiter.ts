import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { TokenBucketRateLimiterWithLua } from "../rate_limiter.service";

const redis = new Redis();

const redirectLimiter = new TokenBucketRateLimiterWithLua(
  redis,
  50, // bucket capacity (burst)
  5   // refill rate (tokens per second)
);

export async function limitRedirects(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString() ||
      "unknown";

    const allowed = await redirectLimiter.isAllowed(ip);

    if (!allowed) {
      return res.status(429).json({
        error: "Too many requests. Please slow down.",
      });
    }

    next();
  } catch (err) {
    next();
  }
}
