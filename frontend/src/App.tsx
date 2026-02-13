import { useValue } from '@legendapp/state/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { conversationsApi, type Message, nodesApi } from './api/client';
import { LoginPage } from './components/Auth/LoginPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ChatPanel } from './components/Chat/ChatPanel';
import { GraphView } from './components/Graph/GraphView';
import { Header } from './components/Header/Header';
import { ResizeHandle } from './components/Layout/ResizeHandle';
import { ContextControl } from './components/Sidebar/ContextControl';
import { NodeList } from './components/Sidebar/NodeList';
import { useResizablePanel } from './hooks/useResizablePanel';
import { uiState$ } from './stores';

type MobileView = 'conversations' | 'chat' | 'graph' | 'context';

const SIDEBAR_WIDTH_STORAGE_KEY = 'weaver:desktop-conversations-width';
const CHAT_WIDTH_STORAGE_KEY = 'weaver:desktop-chat-width';
const DEFAULT_SIDEBAR_WIDTH = 288;
const DEFAULT_CHAT_WIDTH = 384;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;
const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 560;
const MIN_GRAPH_PANEL_WIDTH = 160;

function Dashboard() {
  const queryClient = useQueryClient();
  const [mobileView, setMobileView] = useState<MobileView>('conversations');
  const desktopLayoutRef = useRef<HTMLDivElement | null>(null);
  const desktopSidebarWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const desktopChatWidthRef = useRef(DEFAULT_CHAT_WIDTH);
  const selectedConversationId = useValue(uiState$.selectedConversationId);
  const selectedNodeRefs = useValue(uiState$.selectedNodeRefs);
  const pinModalOpen = useValue(uiState$.pinModal.open);
  const pinningMessage = useValue(uiState$.pinModal.message);
  const pinName = useValue(uiState$.pinModal.name);

  const getDesktopLayoutWidth = useCallback(() => {
    return desktopLayoutRef.current?.clientWidth ?? window.innerWidth;
  }, []);

  const getDesktopSidebarMaxWidth = useCallback(() => {
    const layoutWidth = getDesktopLayoutWidth();
    const maxByLayout =
      layoutWidth - desktopChatWidthRef.current - MIN_GRAPH_PANEL_WIDTH;

    return Math.max(
      MIN_SIDEBAR_WIDTH,
      Math.min(MAX_SIDEBAR_WIDTH, maxByLayout),
    );
  }, [getDesktopLayoutWidth]);

  const getDesktopChatMaxWidth = useCallback(() => {
    const layoutWidth = getDesktopLayoutWidth();
    const maxByLayout =
      layoutWidth - desktopSidebarWidthRef.current - MIN_GRAPH_PANEL_WIDTH;

    return Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, maxByLayout));
  }, [getDesktopLayoutWidth]);

  const {
    width: desktopSidebarWidth,
    isResizing: isResizingSidebar,
    startResizing: handleSidebarResizeStart,
    clampWidth: clampSidebarWidth,
  } = useResizablePanel({
    containerRef: desktopLayoutRef,
    defaultWidth: DEFAULT_SIDEBAR_WIDTH,
    getMaxWidth: getDesktopSidebarMaxWidth,
    maxWidth: MAX_SIDEBAR_WIDTH,
    minWidth: MIN_SIDEBAR_WIDTH,
    side: 'left',
    storageKey: SIDEBAR_WIDTH_STORAGE_KEY,
  });

  const {
    width: desktopChatWidth,
    isResizing: isResizingChat,
    startResizing: handleChatResizeStart,
    clampWidth: clampChatWidth,
  } = useResizablePanel({
    containerRef: desktopLayoutRef,
    defaultWidth: DEFAULT_CHAT_WIDTH,
    getMaxWidth: getDesktopChatMaxWidth,
    maxWidth: MAX_CHAT_WIDTH,
    minWidth: MIN_CHAT_WIDTH,
    side: 'right',
    storageKey: CHAT_WIDTH_STORAGE_KEY,
  });

  desktopSidebarWidthRef.current = desktopSidebarWidth;
  desktopChatWidthRef.current = desktopChatWidth;

  useEffect(() => {
    if (!Number.isFinite(desktopSidebarWidth) || !Number.isFinite(desktopChatWidth)) {
      return;
    }

    clampSidebarWidth();
    clampChatWidth();
  }, [
    clampChatWidth,
    clampSidebarWidth,
    desktopChatWidth,
    desktopSidebarWidth,
  ]);

  // Fetch nodes
  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.list({ limit: 100 }),
  });

  // Fetch all node references
  const { data: nodeReferences = [] } = useQuery({
    queryKey: ['node-references'],
    queryFn: () => nodesApi.getAllReferences(),
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.list(),
  });

  // Fetch selected conversation
  const { data: selectedConversation } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () =>
      selectedConversationId
        ? conversationsApi.get(selectedConversationId)
        : null,
    enabled: !!selectedConversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: conversationsApi.create,
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      uiState$.selectedConversationId.set(newConversation.id);
      setMobileView('chat');
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: conversationsApi.delete,
    onSuccess: (_, deletedConversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (uiState$.selectedConversationId.peek() === deletedConversationId) {
        uiState$.selectedConversationId.set(null);
        setMobileView('conversations');
      }
    },
  });

  // Delete node mutation
  const deleteNodeMutation = useMutation({
    mutationFn: nodesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['node-references'] });
      if (uiState$.selectedNodeId.peek()) {
        uiState$.selectedNodeId.set(null);
      }
    },
  });

  // Update node mutation (for pinning)
  const updateNodeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof nodesApi.update>[1];
    }) => nodesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['node-references'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', uiState$.selectedConversationId.peek()],
      });
    },
  });

  const handleNewConversation = () => {
    const title = `Conversation ${conversations.length + 1}`;
    createConversationMutation.mutate({ title });
  };

  const handleSelectConversation = (conversationId: string) => {
    uiState$.selectedConversationId.set(conversationId);
    setMobileView('chat');
  };

  const handlePinMessage = (message: Message) => {
    uiState$.pinModal.set({
      open: true,
      message,
      name: message.name || '',
    });
  };

  const handlePinSubmit = async () => {
    const msg = uiState$.pinModal.message.peek();
    if (!msg) return;
    const name = uiState$.pinModal.name.peek().trim();
    const data: Parameters<typeof nodesApi.update>[1] = {
      isPinned: true,
    };

    if (name.length > 0) {
      data.name = name;
    }

    await updateNodeMutation.mutateAsync({
      id: msg.nodeId,
      data,
    });

    uiState$.pinModal.set({ open: false, message: null, name: '' });
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    const currentSelectedId = uiState$.selectedNodeId.peek();
    const refs = uiState$.selectedNodeRefs.peek();

    if (currentSelectedId === nodeId) {
      uiState$.selectedNodeId.set(null);
      if (refs.includes(nodeId)) {
        uiState$.selectedNodeRefs.set(refs.filter((id) => id !== nodeId));
      }
      return;
    }

    uiState$.selectedNodeId.set(nodeId);
    if (!refs.includes(nodeId)) {
      uiState$.selectedNodeRefs.set([...refs, nodeId]);
    }
  }, []);

  const renderConversations = (listClassName: string) => (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary">Conversations</h2>
        <button
          onClick={handleNewConversation}
          className="p-1 text-text-accent hover:text-accent-hover hover:bg-surface-accent rounded transition-colors"
          title="New conversation"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <ul className={`space-y-1 ${listClassName}`}>
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`
              group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer
              ${
                conv.id === selectedConversationId
                  ? 'bg-surface-selected text-text-primary'
                  : 'hover:bg-surface-muted text-text-secondary'
              }
            `}
            onClick={() => handleSelectConversation(conv.id)}
          >
            <span className="text-sm truncate flex-1">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteConversationMutation.mutate(conv.id);
              }}
              className="p-1 text-text-muted hover:text-status-danger opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              title="Delete conversation"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className="h-dvh flex flex-col bg-canvas text-text-primary">
      <Header />

      <div
        ref={desktopLayoutRef}
        className="hidden md:flex flex-1 overflow-hidden min-h-0"
      >
        {/* Left Sidebar */}
        <div
          className="border-r border-border bg-canvas-muted flex flex-col shrink-0"
          style={{ width: `${desktopSidebarWidth}px` }}
        >
          {/* Conversations */}
          <div className="p-4 border-b border-border">
            {renderConversations('max-h-48 overflow-y-auto')}
          </div>

          {/* Nodes */}
          <div className="flex-1 overflow-y-auto p-4">
            <NodeList
              nodes={nodes}
              selectedNodeIds={selectedNodeRefs}
              onNodeSelect={handleNodeClick}
              onNodeDelete={(id) => deleteNodeMutation.mutate(id)}
            />
          </div>

          {/* Context Control */}
          <div className="p-4 border-t border-border bg-surface">
            <ContextControl nodes={nodes} />
          </div>
        </div>

        <ResizeHandle
          ariaLabel="Resize conversations panel"
          isActive={isResizingSidebar}
          onMouseDown={handleSidebarResizeStart}
        />

        {/* Graph View */}
        <div className="flex-1 min-w-0 graph-panel-background">
          <GraphView
            nodes={nodes}
            references={nodeReferences}
            selectedNodeIds={selectedNodeRefs}
            onNodeSelect={handleNodeClick}
          />
        </div>

        <ResizeHandle
          ariaLabel="Resize chat panel"
          isActive={isResizingChat}
          onMouseDown={handleChatResizeStart}
        />

        {/* Chat Panel */}
        <div
          className="border-l border-border bg-surface flex flex-col shrink-0"
          style={{ width: `${desktopChatWidth}px` }}
        >
          <ChatPanel
            messages={selectedConversation?.messages || []}
            nodes={nodes}
            onPinMessage={handlePinMessage}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>

      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <div className="border-b border-border bg-surface px-3 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {([
              { id: 'conversations', label: 'Conversations' },
              { id: 'chat', label: 'Chat' },
              { id: 'graph', label: 'Graph' },
              { id: 'context', label: 'Context' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileView(tab.id)}
                className={`
                  px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors
                  ${
                    mobileView === tab.id
                      ? 'bg-accent text-accent-contrast'
                      : 'bg-surface-muted text-text-secondary hover:bg-surface-overlay'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {mobileView === 'conversations' && (
            <div className="h-full bg-canvas-muted p-4">
              <div className="h-full rounded-xl border border-border bg-surface p-4 shadow-panel flex flex-col min-h-0">
                {renderConversations('flex-1 min-h-0 overflow-y-auto')}
              </div>
            </div>
          )}

          {mobileView === 'chat' && (
            <div className="h-full bg-surface">
              <ChatPanel
                messages={selectedConversation?.messages || []}
                nodes={nodes}
                onPinMessage={handlePinMessage}
                onNodeClick={handleNodeClick}
              />
            </div>
          )}

          {mobileView === 'graph' && (
            <div className="h-full graph-panel-background">
              <GraphView
                nodes={nodes}
                references={nodeReferences}
                selectedNodeIds={selectedNodeRefs}
                onNodeSelect={handleNodeClick}
              />
            </div>
          )}

          {mobileView === 'context' && (
            <div className="h-full overflow-y-auto bg-canvas-muted p-4 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-panel">
                <NodeList
                  nodes={nodes}
                  selectedNodeIds={selectedNodeRefs}
                  onNodeSelect={handleNodeClick}
                  onNodeDelete={(id) => deleteNodeMutation.mutate(id)}
                />
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-panel">
                <ContextControl nodes={nodes} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pin Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-elevated border border-border-strong rounded-lg p-6 w-full max-w-md shadow-overlay">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Pin as Node</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={pinName}
                onChange={(e) => uiState$.pinModal.name.set(e.target.value)}
                placeholder="Give this node a name..."
                className="w-full px-3 py-2 border border-border bg-canvas-muted text-text-primary rounded-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-border-accent"
              />
            </div>

            <div className="mb-4 p-3 bg-canvas-muted border border-border rounded-lg text-sm text-text-secondary max-h-40 overflow-y-auto">
              {pinningMessage?.content}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  uiState$.pinModal.set({
                    open: false,
                    message: null,
                    name: '',
                  });
                }}
                className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={updateNodeMutation.isPending}
                className="px-4 py-2 bg-accent text-accent-contrast rounded-lg hover:bg-accent-hover disabled:opacity-disabled transition-colors"
              >
                {updateNodeMutation.isPending ? 'Pinning...' : 'Pin Node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
