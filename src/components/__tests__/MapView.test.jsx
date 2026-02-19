// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapView from '../MapView';

vi.mock('../../lib/constants', () => {
  const tier1Stages = [
    { id: 1, name: '삼각형', nameEn: 'Triangulum', stars: [{ id: 1, x: 50, y: 20, r: 3 }, { id: 2, x: 20, y: 80, r: 3 }], path: [[1, 2]], difficulty: '2별' },
    { id: 2, name: '직선', nameEn: 'Line', stars: [{ id: 1, x: 10, y: 10, r: 3 }, { id: 2, x: 90, y: 90, r: 3 }], path: [[1, 2]], difficulty: '2별' },
  ];
  const tier2Stages = [
    { id: 3, name: '사각형', nameEn: 'Square', stars: [{ id: 1, x: 20, y: 20, r: 3 }, { id: 2, x: 80, y: 20, r: 3 }, { id: 3, x: 50, y: 80, r: 3 }], path: [[1, 2], [2, 3]], difficulty: '3별' },
  ];
  return {
    TIER_GROUPS: [
      { key: 'star2', label: '2별', color: 'emerald', stages: tier1Stages },
      { key: 'star3', label: '3별', color: 'teal', stages: tier2Stages },
    ],
    STAGES: [...tier1Stages, ...tier2Stages],
  };
});

vi.mock('../../lib/gameLogic', () => ({
  isTierUnlocked: (tierIdx, prevStages, completed) => {
    if (tierIdx === 0) return true;
    return prevStages.every(s => completed.includes(s.id));
  },
}));

vi.mock('../Miniature', () => ({
  default: ({ level }) => <div data-testid={`miniature-${level.id}`}>miniature</div>,
}));

describe('MapView', () => {
  const onSelectLevel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tier headers', () => {
    render(<MapView completed={[]} onSelectLevel={onSelectLevel} />);
    expect(screen.getByText('2별')).toBeInTheDocument();
    expect(screen.getByText('3별')).toBeInTheDocument();
  });

  it('shows constellation names in unlocked tier', () => {
    render(<MapView completed={[]} onSelectLevel={onSelectLevel} />);
    expect(screen.getByText('삼각형')).toBeInTheDocument();
    expect(screen.getByText('직선')).toBeInTheDocument();
  });

  it('shows locked message for locked tier', () => {
    render(<MapView completed={[]} onSelectLevel={onSelectLevel} />);
    expect(screen.getByText('이전 단계를 모두 완료하면 열립니다')).toBeInTheDocument();
  });

  it('unlocks tier 2 when tier 1 is completed', () => {
    render(<MapView completed={[1, 2]} onSelectLevel={onSelectLevel} />);
    expect(screen.getByText('사각형')).toBeInTheDocument();
    expect(screen.queryByText('이전 단계를 모두 완료하면 열립니다')).not.toBeInTheDocument();
  });

  it('calls onSelectLevel when constellation is clicked', async () => {
    const user = userEvent.setup();
    render(<MapView completed={[]} onSelectLevel={onSelectLevel} />);
    await user.click(screen.getByText('삼각형'));
    expect(onSelectLevel).toHaveBeenCalled();
  });

  it('shows "수집 완료" for completed constellations', () => {
    render(<MapView completed={[1]} onSelectLevel={onSelectLevel} />);
    expect(screen.getByText('수집 완료 ✨')).toBeInTheDocument();
  });
});
