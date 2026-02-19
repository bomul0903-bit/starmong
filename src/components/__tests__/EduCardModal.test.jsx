// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EduCardModal from '../EduCardModal';
import { TEST_LEVEL } from '../../test/mocks';

vi.mock('../../lib/soundEngine', () => ({
  default: {
    buttonClick: vi.fn(),
    starConnect: vi.fn(),
    mistake: vi.fn(),
    gameComplete: vi.fn(),
    gameFail: vi.fn(),
  },
}));

describe('EduCardModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card title', () => {
    render(<EduCardModal level={TEST_LEVEL} onClose={onClose} />);
    expect(screen.getByText('Star-Mong Card')).toBeInTheDocument();
  });

  it('renders constellation name', () => {
    render(<EduCardModal level={TEST_LEVEL} onClose={onClose} />);
    expect(screen.getByText('테스트별자리')).toBeInTheDocument();
  });

  it('renders constellation description', () => {
    render(<EduCardModal level={TEST_LEVEL} onClose={onClose} />);
    expect(screen.getByText(/"테스트용 별자리입니다."/)).toBeInTheDocument();
  });

  it('renders SVG with lines and circles', () => {
    const { container } = render(<EduCardModal level={TEST_LEVEL} onClose={onClose} />);
    expect(container.querySelectorAll('line')).toHaveLength(1);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('calls onClose on close button click', async () => {
    const user = userEvent.setup();
    render(<EduCardModal level={TEST_LEVEL} onClose={onClose} />);
    await user.click(screen.getByText('도감에 보관하기'));
    expect(onClose).toHaveBeenCalled();
  });
});
