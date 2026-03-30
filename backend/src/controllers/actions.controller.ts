import { Response } from 'express';
import { AuthRequest } from '../types';
import { actionPlanService } from '../services/action-plan.service';

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

    if (userId !== req.userId) {
      res.status(403).json({ error: 'Accès refusé.' });
      return;
    }

    const actions = await actionPlanService.getActionsForUser(userId);
    res.json(actions.map(actionPlanService.toResponse.bind(actionPlanService)));
  },

  // POST /api/actions
  async createAction(req: AuthRequest, res: Response): Promise<void> {
    const { title, description, category, priority, targetAmount, currentAmount, deadline } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: 'Le titre est requis.' });
      return;
    }

    const action = await actionPlanService.create(req.userId, {
      title,
      description,
      category,
      priority,
      targetAmount,
      currentAmount,
      deadline,
    });

    res.json(actionPlanService.toResponse(action));
  },

  // PUT /api/actions/:id/status
  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    const id = BigInt(req.params['id'] as string);
    const { status, currentAmount } = req.body;

    const action = await actionPlanService.findById(id);
    if (!action) {
      res.status(404).json({ error: 'Action introuvable.' });
      return;
    }

    if (action.userId !== req.userId) {
      res.status(403).json({ error: 'Accès refusé.' });
      return;
    }

    const validStatuses = ['EN_COURS', 'TERMINE', 'ABANDONNED'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `Statut invalide : ${status}` });
      return;
    }

    const updatedAmount =
      currentAmount !== undefined && currentAmount !== null ? Number(currentAmount) : undefined;

    const updated = await actionPlanService.updateStatus(id, status, updatedAmount, !!status);
    res.json(actionPlanService.toResponse(updated));
  },

  // DELETE /api/actions/:id
  async deleteAction(req: AuthRequest, res: Response): Promise<void> {
    const id = BigInt(req.params['id'] as string);

    const action = await actionPlanService.findById(id);
    if (!action) {
      res.status(404).json({ error: 'Action introuvable.' });
      return;
    }

    if (action.userId !== req.userId) {
      res.status(403).json({ error: 'Accès refusé.' });
      return;
    }

    await actionPlanService.deleteById(id);
    res.status(204).send();
  },
};
