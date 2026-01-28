import { observable } from '@legendapp/state';
import type { Message } from '@/api/client';

export interface UIState {
  selectedConversationId: string | null;
  selectedNodeId: string | null;
  selectedNodeRefs: string[];
  useOnlyExplicit: boolean;
  pinModal: {
    open: boolean;
    message: Message | null;
    name: string;
  };
}

export const uiState$ = observable<UIState>({
  selectedConversationId: null,
  selectedNodeId: null,
  selectedNodeRefs: [],
  useOnlyExplicit: false,
  pinModal: { open: false, message: null, name: '' },
});
