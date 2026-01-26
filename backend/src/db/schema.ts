import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  vector,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const referenceTypeEnum = pgEnum('reference_type', ['explicit', 'implicit']);
export const roleEnum = pgEnum('role', ['user', 'assistant']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  picture: text('picture'),
  googleId: text('google_id').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Nodes table - the core idea units
export const nodes = pgTable(
  'nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    name: text('name'),
    isPinned: boolean('is_pinned').notNull().default(false),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('nodes_user_id_idx').on(table.userId),
    index('nodes_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ]
);

// Node references - edges between nodes
export const nodeReferences = pgTable(
  'node_references',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromNodeId: uuid('from_node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    toNodeId: uuid('to_node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    referenceType: referenceTypeEnum('reference_type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('node_references_from_idx').on(table.fromNodeId),
    index('node_references_to_idx').on(table.toNodeId),
  ]
);

// Conversations table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('conversations_user_id_idx').on(table.userId)]
);

// Conversation nodes - join table for messages in conversations
export const conversationNodes = pgTable(
  'conversation_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('conversation_nodes_conversation_idx').on(table.conversationId),
    index('conversation_nodes_position_idx').on(table.conversationId, table.position),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  nodes: many(nodes),
  conversations: many(conversations),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  user: one(users, {
    fields: [nodes.userId],
    references: [users.id],
  }),
  outgoingReferences: many(nodeReferences, { relationName: 'fromNode' }),
  incomingReferences: many(nodeReferences, { relationName: 'toNode' }),
  conversationNodes: many(conversationNodes),
}));

export const nodeReferencesRelations = relations(nodeReferences, ({ one }) => ({
  fromNode: one(nodes, {
    fields: [nodeReferences.fromNodeId],
    references: [nodes.id],
    relationName: 'fromNode',
  }),
  toNode: one(nodes, {
    fields: [nodeReferences.toNodeId],
    references: [nodes.id],
    relationName: 'toNode',
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  conversationNodes: many(conversationNodes),
}));

export const conversationNodesRelations = relations(conversationNodes, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationNodes.conversationId],
    references: [conversations.id],
  }),
  node: one(nodes, {
    fields: [conversationNodes.nodeId],
    references: [nodes.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type NodeReference = typeof nodeReferences.$inferSelect;
export type NewNodeReference = typeof nodeReferences.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationNode = typeof conversationNodes.$inferSelect;
export type NewConversationNode = typeof conversationNodes.$inferInsert;
