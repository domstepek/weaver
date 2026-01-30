import { describe, expect, it, vi } from 'vitest';
import type { Node } from '../db/schema.js';
import { formatNodesAsContext, generateEmbedding, parseNodeReferences } from './ai.js';

// Mock the voyageai module
vi.mock('voyageai', () => {
	// Create a mock embed function
	const mockEmbed = vi.fn().mockImplementation(({ input }: { input: string }) => {
		// Generate a deterministic mock embedding based on input
		const embedding = new Array(1024).fill(0);
		for (let i = 0; i < input.length; i++) {
			const charCode = input.charCodeAt(i);
			embedding[i % 1024] += charCode / 1000;
			embedding[(i * 7) % 1024] += charCode / 2000;
			embedding[(i * 13) % 1024] += charCode / 3000;
		}

		// Normalize the embedding
		const magnitude = Math.sqrt(
			embedding.reduce((sum, val) => sum + val * val, 0),
		);
		if (magnitude > 0) {
			for (let i = 0; i < embedding.length; i++) {
				embedding[i] /= magnitude;
			}
		}

		return Promise.resolve({
			data: [{ embedding }],
		});
	});

	// Create a mock VoyageAIClient class
	class MockVoyageAIClient {
		embed = mockEmbed;
	}

	return {
		VoyageAIClient: MockVoyageAIClient,
	};
});

describe('AI Service', () => {
	describe('generateEmbedding', () => {
		it('should generate a 1024-dimensional embedding', async () => {
			const text = 'This is a test';
			const embedding = await generateEmbedding(text);

			expect(embedding).toHaveLength(1024);
		});

		it('should generate deterministic embeddings for the same input', async () => {
			const text = 'Consistent input';
			const embedding1 = await generateEmbedding(text);
			const embedding2 = await generateEmbedding(text);

			expect(embedding1).toEqual(embedding2);
		});

		it('should generate normalized embeddings', async () => {
			const text = 'Normalize me';
			const embedding = await generateEmbedding(text);

			// Calculate magnitude
			const magnitude = Math.sqrt(
				embedding.reduce((sum, val) => sum + val * val, 0)
			);

			// Should be approximately 1 (normalized)
			expect(magnitude).toBeCloseTo(1, 5);
		});

		it('should generate different embeddings for different inputs', async () => {
			const embedding1 = await generateEmbedding('First text');
			const embedding2 = await generateEmbedding('Second text');

			expect(embedding1).not.toEqual(embedding2);
		});
	});

	describe('parseNodeReferences', () => {
		it('should parse node references from text', () => {
			const text =
				'Check out [My Node](12345678-1234-1234-1234-123456789abc) and [Another](87654321-4321-4321-4321-cba987654321)';
			const nodeIds = parseNodeReferences(text);

			expect(nodeIds).toEqual([
				'12345678-1234-1234-1234-123456789abc',
				'87654321-4321-4321-4321-cba987654321',
			]);
		});

		it('should return empty array when no references found', () => {
			const text = 'This text has no node references';
			const nodeIds = parseNodeReferences(text);

			expect(nodeIds).toEqual([]);
		});

		it('should handle duplicate node references', () => {
			const text =
				'[Node](12345678-1234-1234-1234-123456789abc) and [Same Node](12345678-1234-1234-1234-123456789abc)';
			const nodeIds = parseNodeReferences(text);

			// Should deduplicate
			expect(nodeIds).toEqual(['12345678-1234-1234-1234-123456789abc']);
		});

		it('should only match valid UUID format', () => {
			const text =
				'[Invalid](not-a-uuid) [Valid](12345678-1234-1234-1234-123456789abc)';
			const nodeIds = parseNodeReferences(text);

			expect(nodeIds).toEqual(['12345678-1234-1234-1234-123456789abc']);
		});
	});

	describe('formatNodesAsContext', () => {
		const mockNode: Node = {
			id: '12345678-1234-1234-1234-123456789abc',
			userId: 'user-123',
			content: 'This is the node content',
			name: 'Test Node',
			isPinned: false,
			embedding: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should format nodes with names', () => {
			const nodes = [mockNode];
			const context = formatNodesAsContext(nodes);

			expect(context).toContain('Test Node');
			expect(context).toContain('12345678-1234-1234-1234-123456789abc');
			expect(context).toContain('This is the node content');
			expect(context).toContain('Relevant Context from Your Knowledge Graph');
		});

		it('should use node ID when name is not provided', () => {
			const nodeWithoutName = { ...mockNode, name: null };
			const nodes = [nodeWithoutName];
			const context = formatNodesAsContext(nodes);

			expect(context).toContain('Node-12345678');
			expect(context).toContain('This is the node content');
		});

		it('should return empty string for empty node list', () => {
			const context = formatNodesAsContext([]);

			expect(context).toBe('');
		});

		it('should format multiple nodes with separators', () => {
			const node2: Node = {
				...mockNode,
				id: '87654321-4321-4321-4321-cba987654321',
				name: 'Second Node',
				content: 'Second node content',
			};

			const nodes = [mockNode, node2];
			const context = formatNodesAsContext(nodes);

			expect(context).toContain('Test Node');
			expect(context).toContain('Second Node');
			expect(context).toContain('---');
		});
	});
});
