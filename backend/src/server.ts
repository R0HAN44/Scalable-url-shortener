// src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import { findByShortCode } from './modules/links/links.repository';
import linksRouter from './routes/links';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'URL Shortener Service is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/links', linksRouter);

// Redirect route
app.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const link = await findByShortCode(code);

    if (!link) {
      return res.status(404).json({ error: 'Short link not found' });
    }

    // TODO: Enqueue analytics (non-blocking)
    // publishClickEvent({ linkId: link.id, ip: req.ip, ... });

    res.redirect(302, link.original_url);
  } catch (error) {
    next(error); // Error handling middleware
  }
});

// Global error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
