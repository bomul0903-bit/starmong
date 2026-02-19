import { vi } from 'vitest';

export function mockSoundEngine() {
  vi.mock('../lib/soundEngine', () => ({
    default: {
      starConnect: vi.fn(),
      mistake: vi.fn(),
      gameComplete: vi.fn(),
      gameFail: vi.fn(),
      buttonClick: vi.fn(),
    },
  }));
}

export function mockSupabase() {
  const mock = {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({}),
      signInAnonymously: vi.fn().mockResolvedValue({}),
      signOut: vi.fn().mockResolvedValue({}),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  };
  vi.mock('../lib/supabase', () => ({ supabase: mock }));
  return mock;
}

export const TEST_LEVEL = {
  id: 1,
  name: '테스트별자리',
  nameEn: 'Test Constellation',
  desc: '테스트용 별자리입니다.',
  difficulty: '2별',
  stars: [
    { id: 1, x: 30, y: 30, r: 3, name: 'A' },
    { id: 2, x: 70, y: 70, r: 3, name: 'B' },
  ],
  path: [[1, 2]],
};

export const TEST_LEVEL_3STAR = {
  id: 2,
  name: '삼각별자리',
  nameEn: 'Triangle',
  desc: '삼각형 별자리입니다.',
  difficulty: '3별',
  stars: [
    { id: 1, x: 50, y: 20, r: 3, name: 'A' },
    { id: 2, x: 20, y: 80, r: 3, name: 'B' },
    { id: 3, x: 80, y: 80, r: 3, name: 'C' },
  ],
  path: [[1, 2], [2, 3]],
};
