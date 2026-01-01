import { Router } from 'express';
import { createLink, findLinksByUserId } from '../modules/links/links.repository';
import { AuthenticatedRequest } from '../modules/auth/auth';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protected: POST /api/links
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id; 
    const { originalUrl, expiresAt, password } = req.body;

    const shortCode = nanoid(8).toLowerCase();

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
      shortUrl: `http://localhost:3000/${shortCode}`,
      shortCode,
      originalUrl: link.original_url,
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
