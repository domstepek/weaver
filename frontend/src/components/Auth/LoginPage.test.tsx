import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage';

function renderLogin(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/login');
  });

  it('shows default content and starts Google OAuth on click', () => {
    renderLogin('/login');

    expect(screen.getByText('Graph-based knowledge chat')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(window.location.pathname).toBe('/auth/google');
  });

  it('shows mapped oauth errors and fallback error', () => {
    const cases: Array<{ query: string; expected: string }> = [
      { query: 'missing_params', expected: 'Missing authentication parameters.' },
      { query: 'invalid_state', expected: 'Invalid authentication state. Please try again.' },
      { query: 'oauth_failed', expected: 'Authentication failed. Please try again.' },
      { query: 'unexpected', expected: 'An error occurred during sign-in.' },
    ];

    for (const testCase of cases) {
      renderLogin(`/login?error=${testCase.query}`);
      expect(screen.getByText(testCase.expected)).toBeInTheDocument();
    }
  });
});
