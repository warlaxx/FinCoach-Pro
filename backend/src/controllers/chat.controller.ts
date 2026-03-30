import { Response } from 'express';
import { AuthRequest } from '../types';
import { CONSTANTS } from '../config/constants';
import { chatService } from '../services/chat.service';
import prisma from '../config/database';

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
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages.map(toResponse));
  },

  // POST /api/chat
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    const message: string = req.body?.message ?? '';

    if (!message.trim()) {
      res.status(400).json({ error: 'Le message ne peut pas être vide.' });
      return;
    }
    if (message.length > CONSTANTS.MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `Le message est trop long. Maximum ${CONSTANTS.MAX_MESSAGE_LENGTH} caractères.`,
      });
      return;
    }

    // Save the user message
    await prisma.chatMessage.create({
      data: { userId: req.userId, role: 'user', content: message },
    });

    // Fetch recent history for context (last 20, reversed for chronological order)
    const history = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    history.reverse();

    // Call the AI service
    const aiResponse = await chatService.chat(history, message);

    // Save the assistant message
    const assistantMsg = await prisma.chatMessage.create({
      data: { userId: req.userId, role: 'assistant', content: aiResponse },
    });

    res.json(toResponse(assistantMsg));
  },

  // DELETE /api/chat
  async clearHistory(req: AuthRequest, res: Response): Promise<void> {
    await prisma.chatMessage.deleteMany({ where: { userId: req.userId } });
    res.status(204).send();
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
