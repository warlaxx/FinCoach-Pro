import { Response } from 'express';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { chatService } from '../services/chat.service';
import { planService, QuotaExceededError } from '../services/plan.service';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('ChatController');

/**
 * Chat controller — port of Java ChatController.java.
 *
 * Routes:
 *  GET    /api/chat/history  — retrieve chat history
 *  POST   /api/chat          — send a message to the AI coach
 *  DELETE /api/chat          — clear chat history
 */
export const chatController = {
  // GET /api/chat/history
  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    logger.debug('GET /api/chat/history', { userId: req.userId });

    try {
      const messages = await prisma.chatMessage.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'asc' },
      });

      logger.debug('Chat history fetched', { userId: req.userId, messageCount: messages.length });
      res.json({ success: true, data: messages.map(toResponse) });
    } catch (err) {
      logger.error('Get chat history unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // POST /api/chat
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    const message: string = req.body?.message ?? '';

    logger.info('POST /api/chat — user message received', {
      userId: req.userId,
      messageLength: message.length,
    });

    if (!message.trim()) {
      logger.warn('Chat message rejected — empty message', { userId: req.userId });
      res.json({ success: false, message: 'Le message ne peut pas être vide.' });
      return;
    }
    if (message.length > CONSTANTS.MAX_MESSAGE_LENGTH) {
      logger.warn('Chat message rejected — message too long', {
        userId: req.userId,
        messageLength: message.length,
        maxLength: CONSTANTS.MAX_MESSAGE_LENGTH,
      });
      res.json({
        success: false,
        message: `Le message est trop long. Maximum ${CONSTANTS.MAX_MESSAGE_LENGTH} caractères.`,
      });
      return;
    }

    try {
      await planService.assertCanSendChatMessage(req.userId);

      await prisma.chatMessage.create({
        data: { userId: req.userId, role: 'user', content: message },
      });
      logger.debug('User message saved to database', { userId: req.userId });

      const history = await prisma.chatMessage.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      history.reverse();
      logger.debug('Chat history loaded for AI context', { userId: req.userId, historySize: history.length });

      logger.debug('Calling AI chat service', { userId: req.userId });
      const aiResponse = await chatService.chat(history, message);
      logger.info('AI response received', {
        userId: req.userId,
        responseLength: aiResponse.length,
      });

      const assistantMsg = await prisma.chatMessage.create({
        data: { userId: req.userId, role: 'assistant', content: aiResponse },
      });

      res.json({ success: true, data: toResponse(assistantMsg) });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        res.json({
          success: false,
          code: err.code,
          requiredPlan: err.requiredPlan,
          message: err.message,
        });
        return;
      }
      logger.error('Send message unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // DELETE /api/chat
  async clearHistory(req: AuthRequest, res: Response): Promise<void> {
    logger.info('DELETE /api/chat — clearing chat history', { userId: req.userId });

    try {
      await prisma.chatMessage.deleteMany({ where: { userId: req.userId } });
      logger.info('Chat history cleared', { userId: req.userId });
      res.json({ success: true });
    } catch (err) {
      logger.error('Clear chat history unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },
};

function toResponse(msg: { id: bigint; userId: string; role: string; content: string; createdAt: Date }) {
  return {
    id: msg.id.toString(),
    userId: msg.userId,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  };
}
