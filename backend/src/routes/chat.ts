import { and, asc, eq, inArray } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  conversationNodes,
  conversations,
  db,
  nodeReferences,
  nodes,
} from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import {
  chat,
  findSimilarNodes,
  formatNodesAsContext,
  generateEmbedding,
  parseNodeReferences,
} from '../services/ai.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Validation schema
const chatSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(50000),
  explicitRefs: z.array(z.string().uuid()).optional().default([]),
  useOnlyExplicit: z.boolean().optional().default(false),
});

// Send message and get AI response
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = chatSchema.parse(req.body);
    const userId = req.user?.id;

    // Verify conversation ownership
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, body.conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .limit(1);

    if (conversation.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Get existing messages in the conversation
    const existingMessages = await db
      .select({
        role: conversationNodes.role,
        content: nodes.content,
        position: conversationNodes.position,
      })
      .from(conversationNodes)
      .innerJoin(nodes, eq(conversationNodes.nodeId, nodes.id))
      .where(eq(conversationNodes.conversationId, body.conversationId))
      .orderBy(asc(conversationNodes.position));

    const nextPosition =
      existingMessages.length > 0
        ? Math.max(...existingMessages.map((m) => m.position)) + 1
        : 0;

    // Create node for user message
    const userEmbedding = await generateEmbedding(body.message);
    const userNode = await db
      .insert(nodes)
      .values({
        userId,
        content: body.message,
        embedding: userEmbedding,
      })
      .returning();

    // Add user message to conversation
    await db.insert(conversationNodes).values({
      conversationId: body.conversationId,
      nodeId: userNode[0].id,
      role: 'user',
      position: nextPosition,
    });

    // Gather context nodes
    const contextNodes: (typeof nodes.$inferSelect)[] = [];

    // Fetch explicit refs (verify ownership)
    if (body.explicitRefs.length > 0) {
      const explicitNodes = await db
        .select()
        .from(nodes)
        .where(
          and(eq(nodes.userId, userId), inArray(nodes.id, body.explicitRefs)),
        );
      contextNodes.push(...explicitNodes);
    }

    // Find semantically similar nodes if not using only explicit refs
    if (!body.useOnlyExplicit) {
      const similarNodes = await findSimilarNodes(
        userId,
        userEmbedding,
        5,
        userNode[0].id,
      );
      // Add similar nodes that aren't already in context
      const existingIds = new Set(contextNodes.map((n) => n.id));
      for (const node of similarNodes) {
        if (!existingIds.has(node.id)) {
          contextNodes.push(node);
        }
      }
    }

    // Format context
    const context = formatNodesAsContext(contextNodes);

    // Build message history for Claude
    const messageHistory = existingMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    messageHistory.push({ role: 'user', content: body.message });

    // Get AI response
    const aiResponse = await chat(messageHistory, context);

    // Create node for AI response
    const aiEmbedding = await generateEmbedding(aiResponse);
    const aiNode = await db
      .insert(nodes)
      .values({
        userId,
        content: aiResponse,
        embedding: aiEmbedding,
      })
      .returning();

    // Add AI response to conversation
    await db.insert(conversationNodes).values({
      conversationId: body.conversationId,
      nodeId: aiNode[0].id,
      role: 'assistant',
      position: nextPosition + 1,
    });

    // Parse references from AI response and create edges
    const referencedNodeIds = parseNodeReferences(aiResponse);
    if (referencedNodeIds.length > 0) {
      // Verify referenced nodes belong to user
      const validRefs = await db
        .select()
        .from(nodes)
        .where(
          and(eq(nodes.userId, userId), inArray(nodes.id, referencedNodeIds)),
        );

      for (const ref of validRefs) {
        await db.insert(nodeReferences).values({
          fromNodeId: aiNode[0].id,
          toNodeId: ref.id,
          referenceType: 'explicit',
        });
      }
    }

    // Create conversation flow edge: user message -> AI response
    await db.insert(nodeReferences).values({
      fromNodeId: userNode[0].id,
      toNodeId: aiNode[0].id,
      referenceType: 'explicit',
    });

    // Create implicit references from user message to context nodes
    for (const contextNode of contextNodes) {
      await db.insert(nodeReferences).values({
        fromNodeId: userNode[0].id,
        toNodeId: contextNode.id,
        referenceType: 'implicit',
      });
    }

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, body.conversationId));

    const { embedding: userEmb, ...userNodeWithoutEmbedding } = userNode[0];
    const { embedding: aiEmb, ...aiNodeWithoutEmbedding } = aiNode[0];

    res.json({
      userMessage: {
        ...userNodeWithoutEmbedding,
        role: 'user',
        position: nextPosition,
      },
      assistantMessage: {
        ...aiNodeWithoutEmbedding,
        role: 'assistant',
        position: nextPosition + 1,
      },
      contextUsed: contextNodes.map((n) => ({
        id: n.id,
        name: n.name,
        content:
          n.content.substring(0, 200) + (n.content.length > 200 ? '...' : ''),
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
