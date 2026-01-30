import { describe, expect, it, vi } from 'vitest';
import { extractNodeIds, parseNodeReferencesInContent } from './nodeReferences';

describe('nodeReferences utils', () => {
  describe('extractNodeIds', () => {
    it('should extract node IDs from content', () => {
      const content =
        'Check [Node 1](12345678-1234-1234-1234-123456789abc) and [Node 2](87654321-4321-4321-4321-cba987654321)';
      const nodeIds = extractNodeIds(content);

      expect(nodeIds).toEqual([
        '12345678-1234-1234-1234-123456789abc',
        '87654321-4321-4321-4321-cba987654321',
      ]);
    });

    it('should return empty array when no node references', () => {
      const content = 'Just plain text';
      const nodeIds = extractNodeIds(content);

      expect(nodeIds).toEqual([]);
    });

    it('should deduplicate node IDs', () => {
      const content =
        '[First](12345678-1234-1234-1234-123456789abc) and [Second](12345678-1234-1234-1234-123456789abc)';
      const nodeIds = extractNodeIds(content);

      expect(nodeIds).toEqual(['12345678-1234-1234-1234-123456789abc']);
    });

    it('should only match valid UUID format', () => {
      const content =
        '[Invalid](not-a-uuid) [Valid](12345678-1234-1234-1234-123456789abc)';
      const nodeIds = extractNodeIds(content);

      expect(nodeIds).toEqual(['12345678-1234-1234-1234-123456789abc']);
    });
  });

  describe('parseNodeReferencesInContent', () => {
    it('should parse plain text without references', () => {
      const onNodeClick = vi.fn();
      const content = 'Just plain text';
      const parts = parseNodeReferencesInContent(content, onNodeClick);

      expect(parts).toEqual(['Just plain text']);
    });

    it('should parse content with single node reference', () => {
      const onNodeClick = vi.fn();
      const content =
        'Check this [My Node](12345678-1234-1234-1234-123456789abc) out';
      const parts = parseNodeReferencesInContent(content, onNodeClick);

      expect(parts).toHaveLength(3); // text before, button, text after
      expect(typeof parts[0]).toBe('string');
      expect(parts[0]).toBe('Check this ');
      expect(typeof parts[1]).toBe('object'); // React element
      expect(typeof parts[2]).toBe('string');
      expect(parts[2]).toBe(' out');
    });

    it('should parse content with multiple node references', () => {
      const onNodeClick = vi.fn();
      const content =
        '[Node 1](12345678-1234-1234-1234-123456789abc) and [Node 2](87654321-4321-4321-4321-cba987654321)';
      const parts = parseNodeReferencesInContent(content, onNodeClick);

      expect(parts).toHaveLength(3); // button, text between, button
    });

    it('should handle content starting with node reference', () => {
      const onNodeClick = vi.fn();
      const content = '[Node](12345678-1234-1234-1234-123456789abc) at start';
      const parts = parseNodeReferencesInContent(content, onNodeClick);

      expect(parts).toHaveLength(2); // button, text after
      expect(typeof parts[0]).toBe('object'); // React element
      expect(parts[1]).toBe(' at start');
    });

    it('should handle content ending with node reference', () => {
      const onNodeClick = vi.fn();
      const content = 'Ends with [Node](12345678-1234-1234-1234-123456789abc)';
      const parts = parseNodeReferencesInContent(content, onNodeClick);

      expect(parts).toHaveLength(2); // text before, button
      expect(parts[0]).toBe('Ends with ');
      expect(typeof parts[1]).toBe('object'); // React element
    });
  });
});
