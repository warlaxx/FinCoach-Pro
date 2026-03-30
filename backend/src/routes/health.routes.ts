import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'UP', database: 'UP' });
  } catch {
    res.status(503).json({ status: 'DOWN', database: 'DOWN' });
  }
});

export default router;
