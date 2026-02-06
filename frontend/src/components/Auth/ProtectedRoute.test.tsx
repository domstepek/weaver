import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('./AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderProtected(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>private-content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('renders spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false });

    renderProtected();

    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });

    renderProtected();

    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });

    renderProtected();

    expect(screen.getByText('private-content')).toBeInTheDocument();
  });
});
