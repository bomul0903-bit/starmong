// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuView from '../MenuView';

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

describe('MenuView', () => {
  const onStart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(<MenuView onStart={onStart} />);
    expect(screen.getByText('Star Mong')).toBeInTheDocument();
  });

  it('displays constellation count', () => {
    render(<MenuView onStart={onStart} />);
    expect(screen.getByText(/88개 별자리 카드/)).toBeInTheDocument();
  });

  it('renders start button', () => {
    render(<MenuView onStart={onStart} />);
    expect(screen.getByText('탐사 시작')).toBeInTheDocument();
  });

  it('calls onStart and SoundEngine on start button click', async () => {
    const user = userEvent.setup();
    render(<MenuView onStart={onStart} />);
    const { default: SoundEngine } = await import('../../lib/soundEngine');
    await user.click(screen.getByText('탐사 시작'));
    expect(onStart).toHaveBeenCalled();
    expect(SoundEngine.buttonClick).toHaveBeenCalled();
  });
});
