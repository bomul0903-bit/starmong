// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FailCardModal from '../FailCardModal';

vi.mock('../../lib/soundEngine', () => ({
  default: {
    buttonClick: vi.fn(),
    starConnect: vi.fn(),
    mistake: vi.fn(),
    gameComplete: vi.fn(),
    gameFail: vi.fn(),
  },
}));

describe('FailCardModal', () => {
  const onRetry = vi.fn();
  const onReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders failure title', () => {
    render(<FailCardModal onRetry={onRetry} onReview={onReview} />);
    expect(screen.getByText('연결 실패')).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<FailCardModal onRetry={onRetry} onReview={onReview} />);
    expect(screen.getByText('다시 도전하기')).toBeInTheDocument();
  });

  it('calls onRetry on retry button click', async () => {
    const user = userEvent.setup();
    render(<FailCardModal onRetry={onRetry} onReview={onReview} />);
    await user.click(screen.getByText('다시 도전하기'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('calls onReview on review button click', async () => {
    const user = userEvent.setup();
    render(<FailCardModal onRetry={onRetry} onReview={onReview} />);
    await user.click(screen.getByText('모양 다시 확인'));
    expect(onReview).toHaveBeenCalled();
  });
});
