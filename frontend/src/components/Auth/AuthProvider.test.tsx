import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';

const mockGetMe = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/api/client', () => ({
  authApi: {
    getMe: () => mockGetMe(),
    logout: () => mockLogout(),
  },
}));

function AuthConsumer() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authed">{String(isAuthenticated)}</div>
      <div data-testid="username">{user?.name ?? 'none'}</div>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

describe('AuthProvider and useAuth', () => {
  beforeEach(() => {
    mockGetMe.mockReset();
    mockLogout.mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const renderOutside = () => render(<AuthConsumer />);
    expect(renderOutside).toThrow('useAuth must be used within an AuthProvider');

    consoleErrorSpy.mockRestore();
  });

  it('marks user as authenticated when auth/me succeeds', async () => {
    mockGetMe.mockResolvedValue({
      user: {
        id: 'u1',
        email: 'u@example.com',
        name: 'Ada',
        picture: null,
        createdAt: '',
        updatedAt: '',
      },
    });

    renderWithQueryClient(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('Ada');
  });

  it('marks user unauthenticated when auth/me fails', async () => {
    mockGetMe.mockRejectedValue(new Error('Unauthorized'));

    renderWithQueryClient(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  it('logs out, clears query cache, and redirects to login', async () => {
    mockGetMe.mockResolvedValue({
      user: {
        id: 'u1',
        email: 'u@example.com',
        name: 'Ada',
        picture: null,
        createdAt: '',
        updatedAt: '',
      },
    });
    mockLogout.mockResolvedValue({ success: true });

    const { queryClient } = renderWithQueryClient(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    const clearSpy = vi.spyOn(queryClient, 'clear');

    await waitFor(() => {
      expect(screen.getByTestId('authed')).toHaveTextContent('true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/login');
  });
});
