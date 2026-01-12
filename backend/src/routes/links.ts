import { Router } from 'express';
import { createLink, findLinksByUserId } from '../modules/links/links.repository';
import { AuthenticatedRequest } from '../modules/auth/auth';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middleware/auth';
import { KgsService } from '../kgs.service';
import { reserveKeyRange } from '../modules/short_code_generation/short_code_generation.repository';
import { limitLinkCreation } from '../middleware/linkCreationRateLimiter';

const router = Router();

// Protected: POST /api/links
router.post('/', requireAuth, limitLinkCreation, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { originalUrl, expiresAt, password } = req.body;
    const kgsService = new KgsService({ reserveRange: reserveKeyRange }, 10000, 0.2);
    kgsService.start();
    const shortCode = await kgsService.getNextKey();

    const link = await createLink({
      userId,
      shortCode,
      originalUrl,
      title: req.body.title,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      passwordHash: password ? await bcrypt.hash(password, 12) : null,
    });
    res.status(201).json({
      id: link.id,
      short_url: `http://localhost:3000/${shortCode}`,
      short_code: link.short_code,
      original_url: link.original_url,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create short URL' });
  }
});

// Protected: GET /api/links - List user's links
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const links = await findLinksByUserId(userId);

  res.json(links);
});

export default router;
