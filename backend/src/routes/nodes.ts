import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, or, desc, sql, ilike } from 'drizzle-orm';
import { db, nodes, nodeReferences, Node } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { generateEmbedding, findSimilarNodes } from '../services/ai.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Validation schemas
const createNodeSchema = z.object({
  content: z.string().min(1).max(50000),
  name: z.string().min(1).max(200).optional(),
  isPinned: z.boolean().optional().default(false),
});

const updateNodeSchema = z.object({
  content: z.string().min(1).max(50000).optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  isPinned: z.boolean().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

// Create node
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createNodeSchema.parse(req.body);
    const userId = req.user!.id;

    // Generate embedding for the content
    const embedding = await generateEmbedding(body.content);

    const newNode = await db
      .insert(nodes)
      .values({
        userId,
        content: body.content,
        name: body.name,
        isPinned: body.isPinned,
        embedding,
      })
      .returning();

    res.status(201).json(newNode[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List user's nodes
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { pinned, search, limit = '50', offset = '0' } = req.query;

    let query = db
      .select({
        id: nodes.id,
        content: nodes.content,
        name: nodes.name,
        isPinned: nodes.isPinned,
        createdAt: nodes.createdAt,
        updatedAt: nodes.updatedAt,
      })
      .from(nodes)
      .where(
        and(
          eq(nodes.userId, userId),
          pinned === 'true' ? eq(nodes.isPinned, true) : undefined,
          search ? ilike(nodes.content, `%${search}%`) : undefined
        )
      )
      .orderBy(desc(nodes.updatedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const result = await query;
    res.json(result);
  } catch (error) {
    console.error('List nodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single node with references
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const node = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
      .limit(1);

    if (node.length === 0) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    // Get references
    const outgoingRefs = await db
      .select({
        id: nodeReferences.id,
        toNodeId: nodeReferences.toNodeId,
        referenceType: nodeReferences.referenceType,
        toNodeName: nodes.name,
        toNodeContent: nodes.content,
      })
      .from(nodeReferences)
      .innerJoin(nodes, eq(nodeReferences.toNodeId, nodes.id))
      .where(eq(nodeReferences.fromNodeId, id));

    const incomingRefs = await db
      .select({
        id: nodeReferences.id,
        fromNodeId: nodeReferences.fromNodeId,
        referenceType: nodeReferences.referenceType,
        fromNodeName: nodes.name,
        fromNodeContent: nodes.content,
      })
      .from(nodeReferences)
      .innerJoin(nodes, eq(nodeReferences.fromNodeId, nodes.id))
      .where(eq(nodeReferences.toNodeId, id));

    const { embedding, ...nodeWithoutEmbedding } = node[0];

    res.json({
      ...nodeWithoutEmbedding,
      outgoingReferences: outgoingRefs,
      incomingReferences: incomingRefs,
    });
  } catch (error) {
    console.error('Get node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update node
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const body = updateNodeSchema.parse(req.body);
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    const updateData: Partial<{
      content: string;
      name: string | null;
      isPinned: boolean;
      embedding: number[];
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (body.content !== undefined) {
      updateData.content = body.content;
      updateData.embedding = await generateEmbedding(body.content);
    }

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.isPinned !== undefined) {
      updateData.isPinned = body.isPinned;
    }

    const updated = await db.update(nodes).set(updateData).where(eq(nodes.id, id)).returning();

    const { embedding, ...nodeWithoutEmbedding } = updated[0];
    res.json(nodeWithoutEmbedding);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete node
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await db
      .delete(nodes)
      .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get related nodes (by references)
router.get('/:id/related', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const node = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
      .limit(1);

    if (node.length === 0) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    // Find semantically similar nodes
    if (node[0].embedding) {
      const similar = await findSimilarNodes(userId, node[0].embedding as number[], 10, id);
      res.json(
        similar.map((n) => {
          const { embedding, ...rest } = n;
          return rest;
        })
      );
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Get related nodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search nodes by semantic similarity
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit } = searchSchema.parse(req.query);
    const userId = req.user!.id;

    const queryEmbedding = await generateEmbedding(query);
    const similar = await findSimilarNodes(userId, queryEmbedding, limit);

    res.json(
      similar.map((n) => {
        const { embedding, ...rest } = n;
        return rest;
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Search nodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
