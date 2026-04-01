import { Response } from 'express';
import { AuthRequest } from '../types';
import { actionPlanService } from '../services/action-plan.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('ActionsController');

/**
 * Action plan controller — port of Java ActionPlanController.java.
 *
 * Routes:
 *  GET    /api/actions/:userId     — list actions (must match authenticated user)
 *  POST   /api/actions             — create a new action
 *  PUT    /api/actions/:id/status  — update action status / currentAmount
 *  DELETE /api/actions/:id         — delete an action
 */
export const actionsController = {
  // GET /api/actions/:userId
  async getActions(req: AuthRequest, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    logger.debug('GET /api/actions/:userId', { requestedUserId: userId, callerUserId: req.userId });

    if (userId !== req.userId) {
      logger.warn('Get actions forbidden — userId mismatch', {
        requestedUserId: userId,
        callerUserId: req.userId,
      });
      res.json({ success: false, message: 'Accès refusé.' });
      return;
    }

    try {
      const actions = await actionPlanService.getActionsForUser(userId);
      logger.debug('Actions fetched', { userId, count: actions.length });
      res.json({ success: true, data: actions.map(actionPlanService.toResponse.bind(actionPlanService)) });
    } catch (err) {
      logger.error('Get actions unexpected error', { userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // POST /api/actions
  async createAction(req: AuthRequest, res: Response): Promise<void> {
    const { title, description, category, priority, targetAmount, currentAmount, deadline } = req.body;

    logger.info('POST /api/actions — creating action', {
      userId: req.userId,
      title,
      category,
      priority,
    });

    if (!title?.trim()) {
      logger.warn('Create action validation failed — missing title', { userId: req.userId });
      res.json({ success: false, message: 'Le titre est requis.' });
      return;
    }

    try {
      const action = await actionPlanService.create(req.userId, {
        title,
        description,
        category,
        priority,
        targetAmount,
        currentAmount,
        deadline,
      });

      logger.info('Action created successfully', { userId: req.userId, actionId: action.id.toString(), title });
      res.json({ success: true, data: actionPlanService.toResponse(action) });
    } catch (err) {
      logger.error('Create action unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // PUT /api/actions/:id/status
  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    const id = BigInt(req.params['id'] as string);
    const { status, currentAmount } = req.body;

    logger.info('PUT /api/actions/:id/status', {
      userId: req.userId,
      actionId: id.toString(),
      newStatus: status,
      currentAmount,
    });

    try {
      const action = await actionPlanService.findById(id);
      if (!action) {
        logger.warn('Update action status failed — action not found', {
          userId: req.userId,
          actionId: id.toString(),
        });
        res.json({ success: false, message: 'Action introuvable.' });
        return;
      }

      if (action.userId !== req.userId) {
        logger.warn('Update action status forbidden — action belongs to different user', {
          callerUserId: req.userId,
          actionOwnerId: action.userId,
          actionId: id.toString(),
        });
        res.json({ success: false, message: 'Accès refusé.' });
        return;
      }

      const validStatuses = ['EN_COURS', 'TERMINE', 'ABANDONNE'];
      if (status && !validStatuses.includes(status)) {
        logger.warn('Update action status failed — invalid status value', {
          userId: req.userId,
          actionId: id.toString(),
          receivedStatus: status,
          validStatuses,
        });
        res.json({ success: false, message: `Statut invalide : ${status}` });
        return;
      }

      const updatedAmount =
        currentAmount !== undefined && currentAmount !== null ? Number(currentAmount) : undefined;

      const updated = await actionPlanService.updateStatus(id, status, updatedAmount, !!status);
      logger.info('Action status updated', {
        userId: req.userId,
        actionId: id.toString(),
        newStatus: updated.status,
      });
      res.json({ success: true, data: actionPlanService.toResponse(updated) });
    } catch (err) {
      logger.error('Update action status unexpected error', { userId: req.userId, actionId: id.toString(), error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // DELETE /api/actions/:id
  async deleteAction(req: AuthRequest, res: Response): Promise<void> {
    const id = BigInt(req.params['id'] as string);
    logger.info('DELETE /api/actions/:id', { userId: req.userId, actionId: id.toString() });

    try {
      const action = await actionPlanService.findById(id);
      if (!action) {
        logger.warn('Delete action failed — action not found', {
          userId: req.userId,
          actionId: id.toString(),
        });
        res.json({ success: false, message: 'Action introuvable.' });
        return;
      }

      if (action.userId !== req.userId) {
        logger.warn('Delete action forbidden — action belongs to different user', {
          callerUserId: req.userId,
          actionOwnerId: action.userId,
          actionId: id.toString(),
        });
        res.json({ success: false, message: 'Accès refusé.' });
        return;
      }

      await actionPlanService.deleteById(id);
      logger.info('Action deleted successfully', { userId: req.userId, actionId: id.toString() });
      res.json({ success: true });
    } catch (err) {
      logger.error('Delete action unexpected error', { userId: req.userId, actionId: id.toString(), error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },
};
