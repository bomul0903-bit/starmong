/**
 * 두 별 연결이 정답 경로에 존재하는지 검증 (방향 무관)
 * @param {number} starA
 * @param {number} starB
 * @param {Array<[number, number]>} pathList - 정답 경로 리스트
 * @returns {boolean}
 */
export function isValidConnection(starA, starB, pathList) {
  return pathList.some(
    (p) => (p[0] === starA && p[1] === starB) || (p[1] === starA && p[0] === starB)
  );
}

/**
 * 이미 그린 선인지 중복 확인 (방향 무관)
 * @param {number} starA
 * @param {number} starB
 * @param {Array<[number, number]>} drawnLines - 이미 그려진 선 리스트
 * @returns {boolean}
 */
export function isLineAlreadyDrawn(starA, starB, drawnLines) {
  return drawnLines.some(
    (l) => (l[0] === starA && l[1] === starB) || (l[1] === starA && l[0] === starB)
  );
}

/**
 * 완료 시 시간 기반 보너스 점수 계산
 * 기본 2000점에서 경과 시간 * 10을 차감 (최대 1000 차감, 최소 보너스 1000)
 * @param {number} elapsedTime - 경과 시간(초)
 * @returns {number} 보너스 점수
 */
export function calculateFinishBonus(elapsedTime) {
  return 2000 - Math.min(1000, elapsedTime * 10);
}

/**
 * 모든 경로 연결이 완료되었는지 확인
 * @param {number} drawnCount - 그려진 선 수
 * @param {number} requiredCount - 필요한 선 수 (경로 수)
 * @returns {boolean}
 */
export function isGameComplete(drawnCount, requiredCount) {
  return drawnCount === requiredCount;
}

/**
 * 실수 처리: 새 실수 횟수와 실패 여부 반환
 * @param {number} currentMistakes - 현재 실수 횟수
 * @param {number} maxMistakes - 최대 허용 실수 (기본 3)
 * @returns {{ newCount: number, isFailed: boolean }}
 */
export function handleMistake(currentMistakes, maxMistakes = 3) {
  const newCount = currentMistakes + 1;
  return { newCount, isFailed: newCount >= maxMistakes };
}

/**
 * 난이도 티어 잠금해제 여부 확인
 * 첫 번째 티어는 항상 해제, 이후 티어는 이전 티어의 모든 스테이지가 완료되어야 해제
 * @param {number} tierIndex - 현재 티어 인덱스
 * @param {Array<{ id: number }>} prevTierStages - 이전 티어의 스테이지 목록
 * @param {number[]} completedIds - 완료된 스테이지 ID 목록
 * @returns {boolean}
 */
export function isTierUnlocked(tierIndex, prevTierStages, completedIds) {
  if (tierIndex === 0) return true;
  return prevTierStages.every((s) => completedIds.includes(s.id));
}

/**
 * 별자리를 티어별로 그룹화하고 별 수 기준으로 정렬
 * @param {Array<{ id: number, difficulty: string, stars: any[] }>} stages
 * @param {Array<{ key: string, label: string, color: string, difficulty: string }>} tiers
 * @returns {Array<{ key: string, label: string, color: string, difficulty: string, stages: any[] }>}
 */
export function groupStagesByTier(stages, tiers) {
  return tiers.map((tier) => ({
    ...tier,
    stages: stages
      .filter((s) => s.difficulty === tier.difficulty)
      .sort((a, b) => a.stars.length - b.stars.length),
  }));
}
