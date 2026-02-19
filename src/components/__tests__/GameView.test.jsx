// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import GameView from '../GameView';
import { TEST_LEVEL_3STAR } from '../../test/mocks';

describe('GameView', () => {
  const defaultProps = {
    currentLevel: TEST_LEVEL_3STAR,
    activeStarId: null,
    selectedStars: [],
    lines: [],
    time: 125,
    isGameActive: true,
    showHint: false,
    mistakes: 1,
    maxMistakes: 3,
    dogMsg: '별을 연결해보세요!',
    onStarClick: vi.fn(),
    onHintClick: vi.fn(),
    onUndoClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays timer formatted as mm:ss', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('displays level name', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByText('삼각별자리')).toBeInTheDocument();
  });

  it('displays connection progress', () => {
    render(<GameView {...defaultProps} lines={[[1, 2]]} />);
    expect(screen.getByText('1/2 연결')).toBeInTheDocument();
  });

  it('displays mistake indicators (rose for remaining, slate for used)', () => {
    const { container } = render(<GameView {...defaultProps} mistakes={1} maxMistakes={3} />);
    const dots = container.querySelectorAll('.rounded-full.w-2\\.5');
    expect(dots).toHaveLength(3);
    // 2 remaining (rose), 1 used (slate)
    const roseDots = container.querySelectorAll('.bg-rose-400');
    const slateDots = container.querySelectorAll('.bg-slate-700');
    expect(roseDots).toHaveLength(2);
    expect(slateDots).toHaveLength(1);
  });

  it('displays hint button', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByText('힌트')).toBeInTheDocument();
  });

  it('displays undo button', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('calls onHintClick when hint button is clicked', async () => {
    const user = userEvent.setup();
    render(<GameView {...defaultProps} />);
    await user.click(screen.getByText('힌트'));
    expect(defaultProps.onHintClick).toHaveBeenCalled();
  });

  it('calls onUndoClick when undo button is clicked', async () => {
    const user = userEvent.setup();
    render(<GameView {...defaultProps} lines={[[1, 2]]} />);
    await user.click(screen.getByText('취소'));
    expect(defaultProps.onUndoClick).toHaveBeenCalled();
  });

  it('disables undo button when no lines drawn', () => {
    render(<GameView {...defaultProps} lines={[]} />);
    const undoBtn = screen.getByText('취소').closest('button');
    expect(undoBtn).toBeDisabled();
  });

  it('disables undo button when game is not active', () => {
    render(<GameView {...defaultProps} lines={[[1, 2]]} isGameActive={false} />);
    const undoBtn = screen.getByText('취소').closest('button');
    expect(undoBtn).toBeDisabled();
  });

  it('displays dog message', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByText('별을 연결해보세요!')).toBeInTheDocument();
  });

  it('renders star buttons for each star', () => {
    render(<GameView {...defaultProps} />);
    const starButtons = screen.getAllByRole('button').filter(
      btn => !btn.textContent.includes('힌트') && !btn.textContent.includes('취소')
    );
    expect(starButtons).toHaveLength(3);
  });

  it('calls onStarClick on star pointerDown when game is active', () => {
    render(<GameView {...defaultProps} />);
    const starButtons = screen.getAllByRole('button').filter(
      btn => !btn.textContent.includes('힌트') && !btn.textContent.includes('취소')
    );
    // Mock setPointerCapture
    starButtons[0].setPointerCapture = vi.fn();
    fireEvent.pointerDown(starButtons[0], { pointerId: 1 });
    expect(defaultProps.onStarClick).toHaveBeenCalledWith(1);
  });

  it('does NOT call onStarClick when game is not active', () => {
    render(<GameView {...defaultProps} isGameActive={false} />);
    const starButtons = screen.getAllByRole('button').filter(
      btn => !btn.textContent.includes('힌트') && !btn.textContent.includes('취소')
    );
    starButtons[0].setPointerCapture = vi.fn();
    fireEvent.pointerDown(starButtons[0], { pointerId: 1 });
    expect(defaultProps.onStarClick).not.toHaveBeenCalled();
  });

  it('shows hint lines with opacity-40 class when showHint is true', () => {
    const { container } = render(<GameView {...defaultProps} showHint={true} />);
    const hintGroup = container.querySelector('.opacity-40');
    expect(hintGroup).toBeInTheDocument();
  });

  it('hides hint lines with opacity-0 class when showHint is false', () => {
    const { container } = render(<GameView {...defaultProps} showHint={false} />);
    const hiddenGroup = container.querySelector('.opacity-0');
    expect(hiddenGroup).toBeInTheDocument();
  });

  it('renders drawn lines as SVG elements', () => {
    const { container } = render(<GameView {...defaultProps} lines={[[1, 2], [2, 3]]} />);
    // Each drawn line renders 2 <line> elements (base + dashed)
    // Plus hint lines (2 paths = 2 lines)
    const allLines = container.querySelectorAll('line');
    // hint lines: 2, drawn lines: 2*2 = 4, total = 6
    expect(allLines.length).toBeGreaterThanOrEqual(6);
  });
});
