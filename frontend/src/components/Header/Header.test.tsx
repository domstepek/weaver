import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const mockUseAuth = vi.fn();

vi.mock('../Auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Header', () => {
  it('renders user avatar image and handles logout', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        email: 'user@example.com',
        name: 'Ada',
        picture: 'https://example.com/avatar.png',
        createdAt: '',
        updatedAt: '',
      },
      logout,
    });

    render(<Header />);

    expect(screen.getByText('Weaver')).toBeInTheDocument();
    expect(screen.getByAltText('Ada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('renders fallback initial when user has no picture', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        email: 'user@example.com',
        name: 'bea',
        picture: null,
        createdAt: '',
        updatedAt: '',
      },
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('bea')).toBeInTheDocument();
  });

  it('renders without auth controls when there is no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    render(<Header />);

    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });
});
