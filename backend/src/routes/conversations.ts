import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db, conversations, conversationNodes, nodes } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

// Create conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createConversationSchema.parse(req.body);
    const userId = req.user!.id;

    const newConversation = await db
      .insert(conversations)
      .values({
        userId,
        title: body.title,
      })
      .returning();

    res.status(201).json(newConversation[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List user's conversations
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '50', offset = '0' } = req.query;

    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json(result);
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation with messages
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .limit(1);

    if (conversation.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Get messages (nodes) in order
    const messages = await db
      .select({
        id: conversationNodes.id,
        nodeId: conversationNodes.nodeId,
        role: conversationNodes.role,
        position: conversationNodes.position,
        content: nodes.content,
        name: nodes.name,
        isPinned: nodes.isPinned,
        createdAt: conversationNodes.createdAt,
      })
      .from(conversationNodes)
      .innerJoin(nodes, eq(conversationNodes.nodeId, nodes.id))
      .where(eq(conversationNodes.conversationId, id))
      .orderBy(asc(conversationNodes.position));

    res.json({
      ...conversation[0],
      messages,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update conversation
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const body = updateConversationSchema.parse(req.body);
    const userId = req.user!.id;
    const { id } = req.params;

    const updated = await db
      .update(conversations)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete conversation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
