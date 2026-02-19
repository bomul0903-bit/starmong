// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from '../LoginView';

const mockSignInWithOAuth = vi.fn().mockResolvedValue({});
const mockSignInAnonymously = vi.fn().mockResolvedValue({});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args) => mockSignInWithOAuth(...args),
      signInAnonymously: (...args) => mockSignInAnonymously(...args),
    },
  },
}));

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(<LoginView />);
    expect(screen.getByText('Star Mong')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<LoginView />);
    expect(screen.getByText(/별자리를 연결하고/)).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    render(<LoginView />);
    expect(screen.getByText('Google로 시작하기')).toBeInTheDocument();
  });

  it('renders anonymous login button', () => {
    render(<LoginView />);
    expect(screen.getByText('둘러보기')).toBeInTheDocument();
  });

  it('calls signInWithOAuth on Google button click', async () => {
    const user = userEvent.setup();
    render(<LoginView />);
    await user.click(screen.getByText('Google로 시작하기'));
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({ provider: 'google' });
  });

  it('calls signInAnonymously on 둘러보기 button click', async () => {
    const user = userEvent.setup();
    render(<LoginView />);
    await user.click(screen.getByText('둘러보기'));
    expect(mockSignInAnonymously).toHaveBeenCalled();
  });
});
