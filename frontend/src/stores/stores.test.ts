import { describe, expect, it } from 'vitest';
import { chatState$ } from './chatState';
import { searchState$ } from './searchState';
import { uiState$ } from './uiState';

describe('stores', () => {
  it('exposes expected chat and search defaults', () => {
    chatState$.input.set('');
    searchState$.query.set('');

    expect(chatState$.input.peek()).toBe('');
    expect(searchState$.query.peek()).toBe('');
  });

  it('updates ui state values', () => {
    uiState$.selectedConversationId.set('conv-1');
    uiState$.selectedNodeId.set('node-1');
    uiState$.selectedNodeRefs.set(['node-1']);
    uiState$.useOnlyExplicit.set(true);

    expect(uiState$.selectedConversationId.peek()).toBe('conv-1');
    expect(uiState$.selectedNodeId.peek()).toBe('node-1');
    expect(uiState$.selectedNodeRefs.peek()).toEqual(['node-1']);
    expect(uiState$.useOnlyExplicit.peek()).toBe(true);
  });

  it('manages pin modal state', () => {
    uiState$.pinModal.set({
      open: true,
      message: {
        id: 'm1',
        nodeId: 'n1',
        role: 'user',
        position: 1,
        content: 'hello',
        name: null,
        isPinned: false,
        createdAt: new Date().toISOString(),
      },
      name: 'Pinned',
    });

    expect(uiState$.pinModal.peek().open).toBe(true);
    expect(uiState$.pinModal.peek().name).toBe('Pinned');

    uiState$.pinModal.set({ open: false, message: null, name: '' });
    expect(uiState$.pinModal.peek()).toEqual({ open: false, message: null, name: '' });
  });
});
