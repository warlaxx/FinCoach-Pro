import { Router, Request, Response, NextFunction } from 'express';
import { actionsController } from '../controllers/actions.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(requireAuth as any);

router.get('/:userId', (req: Request, res: Response, next: NextFunction) =>
  actionsController.getActions(req as AuthRequest, res).catch(next),
);

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  actionsController.createAction(req as AuthRequest, res).catch(next),
);

router.put('/:id/status', (req: Request, res: Response, next: NextFunction) =>
  actionsController.updateStatus(req as AuthRequest, res).catch(next),
);

router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  actionsController.deleteAction(req as AuthRequest, res).catch(next),
);

export default router;
