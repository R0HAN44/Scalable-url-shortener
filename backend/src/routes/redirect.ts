import { Request, Response, NextFunction, Router } from 'express';
import { HashUtil } from '../utils/hash.utl';
import { BanCache } from '../services/ban.cache';
import { NotFoundCache } from '../services/notfound.cache';
import { CachedLink, LinkCache } from '../services/link.cache';
import { findByShortCode } from '../modules/links/links.repository';
import { PasswordUtil } from '../utils/password.util';
import { ClickCache } from '../services/click.cache';

const router = Router();

router.get('/:code', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const shortCode = req.params.code;
        const ipHash = HashUtil.hashIp(req.ip);

        // 1. Check if IP is banned
        if (await BanCache.isBanned(ipHash)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // 2. Negative cache lookup
        if (await NotFoundCache.isNotFound(shortCode)) {
            res.status(404).json({ error: 'Link not found' });
            return;
        }

        // 3. Cache lookup
        let link: CachedLink | null = await LinkCache.get(shortCode);

        // 4. Cache miss → DB
        if (!link) {
            const dbLink = await findByShortCode(shortCode);

            if (!dbLink) {
                await NotFoundCache.markNotFound(shortCode);
                res.status(404).json({ error: 'Link not found' });
                return;
            }

            link = {
                id: dbLink.id,
                original_url: dbLink.original_url,
                is_active: dbLink.is_active,
                expires_at: dbLink.expires_at
                    ? new Date(dbLink.expires_at).toISOString()
                    : null,
                password_hash: dbLink.password_hash,
                user_id: dbLink.user_id,
            };

            await LinkCache.set(shortCode, link);
        }

        // 5. Active check
        if (!link.is_active) {
            res.status(410).json({ error: 'Link has been deactivated' });
            return;
        }

        // 6. Expiry check
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            await LinkCache.invalidate(shortCode);
            res.status(410).json({ error: 'Link has expired' });
            return;
        }

        // 7. Password protection
        if (link.password_hash) {
            const providedPassword = req.query.password as string | undefined;

            if (!providedPassword) {
                res.status(401).json({
                    error: 'Password required',
                    passwordProtected: true,
                });
                return;
            }

            const isValid = await PasswordUtil.verify(
                providedPassword,
                link.password_hash
            );

            if (!isValid) {
                res.status(401).json({ error: 'Incorrect password' });
                return;
            }
        }

        // 8. Click counter (fire-and-forget)
        ClickCache.increment(link.id).catch(err =>
            console.error('Click cache error:', err)
        );

        // 9. Analytics event (fire-and-forget)
        //   publishClickEvent({
        //     linkId: link.id,
        //     ipHash,
        //     userAgent: req.headers['user-agent'],
        //     referrer: req.headers['referer'],
        //     timestamp: new Date().toISOString(),
        //   }).catch(err =>
        //     console.error('Analytics publish error:', err)
        //   );

        // 10. Redirect
        res.redirect(302, link.original_url);
    } catch (error) {
        next(error);
    }
}
);

export default router;
