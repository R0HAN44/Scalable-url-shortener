import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { AuthenticatedRequest } from "../modules/auth/auth";
import { SlidingWindowCounterRateLimiter } from "../rate_limiter.service";

const redis = new Redis();

const linkCreationLimiter = new SlidingWindowCounterRateLimiter(
  redis,
  60 * 1000, // 1 minute window
  10         // 10 links per minute per user
);

export async function limitLinkCreation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allowed = await linkCreationLimiter.isAllowed(String(userId));

    if (!allowed) {
      return res.status(429).json({
        error: "Link creation rate limit exceeded. Please slow down.",
      });
    }

    next();
  } catch (err) {
    next();
  }
}
