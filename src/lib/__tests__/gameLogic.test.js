import { describe, it, expect } from 'vitest';
import {
  isValidConnection,
  isLineAlreadyDrawn,
  calculateFinishBonus,
  isGameComplete,
  handleMistake,
  isTierUnlocked,
  groupStagesByTier,
} from '../gameLogic.js';

describe('isValidConnection', () => {
  const pathList = [[1, 2], [2, 3], [3, 4]];

  it('정방향 유효 경로를 인식한다', () => {
    expect(isValidConnection(1, 2, pathList)).toBe(true);
  });

  it('역방향 유효 경로를 인식한다', () => {
    expect(isValidConnection(2, 1, pathList)).toBe(true);
  });

  it('존재하지 않는 경로는 거부한다', () => {
    expect(isValidConnection(1, 4, pathList)).toBe(false);
  });

  it('빈 경로 리스트에서는 항상 false', () => {
    expect(isValidConnection(1, 2, [])).toBe(false);
  });
});

describe('isLineAlreadyDrawn', () => {
  const drawnLines = [[1, 2], [3, 4]];

  it('정방향으로 이미 그린 선을 감지한다', () => {
    expect(isLineAlreadyDrawn(1, 2, drawnLines)).toBe(true);
  });

  it('역방향으로 이미 그린 선을 감지한다', () => {
    expect(isLineAlreadyDrawn(2, 1, drawnLines)).toBe(true);
  });

  it('아직 그리지 않은 선은 false', () => {
    expect(isLineAlreadyDrawn(1, 3, drawnLines)).toBe(false);
  });

  it('빈 리스트에서는 항상 false', () => {
    expect(isLineAlreadyDrawn(1, 2, [])).toBe(false);
  });
});

describe('calculateFinishBonus', () => {
  it('0초일 때 최대 보너스 2000', () => {
    expect(calculateFinishBonus(0)).toBe(2000);
  });

  it('50초일 때 1500 보너스', () => {
    expect(calculateFinishBonus(50)).toBe(1500);
  });

  it('100초일 때 최소 보너스 1000', () => {
    expect(calculateFinishBonus(100)).toBe(1000);
  });

  it('200초에도 음수가 되지 않는다 (최소 1000)', () => {
    expect(calculateFinishBonus(200)).toBe(1000);
  });
});

describe('isGameComplete', () => {
  it('그린 수와 필요한 수가 같으면 완료', () => {
    expect(isGameComplete(5, 5)).toBe(true);
  });

  it('그린 수가 부족하면 미완료', () => {
    expect(isGameComplete(3, 5)).toBe(false);
  });

  it('0개 경로도 완료로 처리', () => {
    expect(isGameComplete(0, 0)).toBe(true);
  });
});

describe('handleMistake', () => {
  it('1회 실수 → 계속 진행', () => {
    const result = handleMistake(0, 3);
    expect(result).toEqual({ newCount: 1, isFailed: false });
  });

  it('2회 실수 → 계속 진행', () => {
    const result = handleMistake(1, 3);
    expect(result).toEqual({ newCount: 2, isFailed: false });
  });

  it('3회 실수 → 실패', () => {
    const result = handleMistake(2, 3);
    expect(result).toEqual({ newCount: 3, isFailed: true });
  });

  it('이미 3회 이상이면 여전히 실패', () => {
    const result = handleMistake(3, 3);
    expect(result).toEqual({ newCount: 4, isFailed: true });
  });

  it('기본 maxMistakes는 3', () => {
    const result = handleMistake(2);
    expect(result.isFailed).toBe(true);
  });
});

describe('isTierUnlocked', () => {
  const prevStages = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('첫 번째 티어(index 0)는 항상 해제', () => {
    expect(isTierUnlocked(0, [], [])).toBe(true);
  });

  it('이전 티어 미완료 시 잠금', () => {
    expect(isTierUnlocked(1, prevStages, [1, 2])).toBe(false);
  });

  it('이전 티어 모두 완료 시 해제', () => {
    expect(isTierUnlocked(1, prevStages, [1, 2, 3])).toBe(true);
  });

  it('완료 목록에 추가 항목이 있어도 해제', () => {
    expect(isTierUnlocked(1, prevStages, [1, 2, 3, 4, 5])).toBe(true);
  });
});

describe('groupStagesByTier', () => {
  const tiers = [
    { key: 'easy', label: '쉬움', color: 'emerald', difficulty: '쉬움' },
    { key: 'hard', label: '어려움', color: 'orange', difficulty: '어려움' },
  ];

  const stages = [
    { id: 1, difficulty: '쉬움', stars: [1, 2, 3, 4, 5] },
    { id: 2, difficulty: '쉬움', stars: [1, 2, 3] },
    { id: 3, difficulty: '어려움', stars: [1, 2, 3, 4, 5, 6, 7] },
    { id: 4, difficulty: '어려움', stars: [1, 2, 3, 4] },
  ];

  it('티어별로 올바르게 그룹화한다', () => {
    const result = groupStagesByTier(stages, tiers);
    expect(result).toHaveLength(2);
    expect(result[0].stages).toHaveLength(2);
    expect(result[1].stages).toHaveLength(2);
  });

  it('별 수 기준으로 오름차순 정렬한다', () => {
    const result = groupStagesByTier(stages, tiers);
    // 쉬움: id 2 (3별) → id 1 (5별)
    expect(result[0].stages[0].id).toBe(2);
    expect(result[0].stages[1].id).toBe(1);
    // 어려움: id 4 (4별) → id 3 (7별)
    expect(result[1].stages[0].id).toBe(4);
    expect(result[1].stages[1].id).toBe(3);
  });

  it('티어 메타데이터가 유지된다', () => {
    const result = groupStagesByTier(stages, tiers);
    expect(result[0].key).toBe('easy');
    expect(result[0].label).toBe('쉬움');
    expect(result[1].key).toBe('hard');
  });

  it('해당 스테이지가 없는 티어는 빈 배열', () => {
    const emptyTiers = [{ key: 'x', label: 'X', color: 'red', difficulty: '없음' }];
    const result = groupStagesByTier(stages, emptyTiers);
    expect(result[0].stages).toHaveLength(0);
  });
});
