import express from 'express';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { sites } from './src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import cors from 'cors';
import { z } from 'zod';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes (v1)
  const apiRouter = express.Router();

  // Basic Rate Limiter
  const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Placeholder - would use 'express-rate-limit' in real production
    next();
  };
  apiRouter.use(rateLimit);

  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  apiRouter.get('/auth/me', requireAuth, (req: any, res) => {
    res.json({ user: req.user, dbUser: req.dbUser });
  });

  const siteSchema = z.object({
    domain: z.string().min(3),
  });

  apiRouter.post('/sites', requireAuth, async (req: any, res) => {
    const validation = siteSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ error: validation.error });
    
    const { domain } = validation.data;
    
    const siteKey = `sk_${crypto.randomBytes(16).toString('hex')}`;
    const secretKey = `sec_${crypto.randomBytes(32).toString('hex')}`;
    const secretKeyHash = crypto.createHash('sha256').update(secretKey).digest('hex');

    const [newSite] = await db.insert(sites).values({
      userId: req.dbUser.id,
      domain,
      siteKey,
      secretKeyHash,
    }).returning();

    res.json({ ...newSite, secretKey });
  });

  apiRouter.get('/sites', requireAuth, async (req: any, res) => {
    const userSites = await db.select().from(sites).where(eq(sites.userId, req.dbUser.id));
    res.json(userSites);
  });

  apiRouter.delete('/sites/:id', requireAuth, async (req: any, res) => {
    const siteId = parseInt(req.params.id);
    if (isNaN(siteId)) return res.status(400).json({ error: 'Invalid site ID' });

    const [deletedSite] = await db.delete(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, req.dbUser.id)))
      .returning();

    if (!deletedSite) return res.status(404).json({ error: 'Site not found or unauthorized' });
    res.json({ message: 'Site deleted successfully' });
  });

  app.use('/api/v1', apiRouter);

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
