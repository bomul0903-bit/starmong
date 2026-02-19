// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopBar from '../TopBar';

vi.mock('../../lib/soundEngine', () => ({
  default: {
    buttonClick: vi.fn(),
    starConnect: vi.fn(),
    mistake: vi.fn(),
    gameComplete: vi.fn(),
    gameFail: vi.fn(),
  },
}));

vi.mock('../../lib/constants', () => ({
  STAGES: Array.from({ length: 88 }, (_, i) => ({ id: i + 1 })),
}));

describe('TopBar', () => {
  const defaultProps = {
    score: 12500,
    completedCount: 5,
    onHomeClick: vi.fn(),
    user: null,
    onLogout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays formatted score', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });

  it('displays completed count with total', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('5/88')).toBeInTheDocument();
  });

  it('shows User icon for anonymous user', () => {
    render(<TopBar {...defaultProps} user={{ is_anonymous: true }} />);
    // Anonymous user gets a div wrapper with bg-slate-700
    const avatarContainer = document.querySelector('.bg-slate-700');
    expect(avatarContainer).toBeInTheDocument();
  });

  it('shows avatar image for Google user', () => {
    const { container } = render(<TopBar {...defaultProps} user={{ is_anonymous: false, user_metadata: { avatar_url: 'https://example.com/avatar.png' } }} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('shows no avatar when user is null', () => {
    render(<TopBar {...defaultProps} user={null} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('.bg-slate-700')).not.toBeInTheDocument();
  });

  it('calls onHomeClick and SoundEngine on Home button click', async () => {
    const user = userEvent.setup();
    render(<TopBar {...defaultProps} />);
    const { default: SoundEngine } = await import('../../lib/soundEngine');
    const buttons = screen.getAllByRole('button');
    // Home button is the first button
    await user.click(buttons[0]);
    expect(defaultProps.onHomeClick).toHaveBeenCalled();
    expect(SoundEngine.buttonClick).toHaveBeenCalled();
  });

  it('calls onLogout and SoundEngine on Logout button click', async () => {
    const user = userEvent.setup();
    render(<TopBar {...defaultProps} />);
    const { default: SoundEngine } = await import('../../lib/soundEngine');
    const buttons = screen.getAllByRole('button');
    // Logout button is the second button
    await user.click(buttons[1]);
    expect(defaultProps.onLogout).toHaveBeenCalled();
    expect(SoundEngine.buttonClick).toHaveBeenCalled();
  });

  it('hides logout button when onLogout is not provided', () => {
    render(<TopBar {...defaultProps} onLogout={undefined} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1); // Only Home button
  });
});
