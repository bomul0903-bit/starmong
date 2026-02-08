import constellationData from '../data/constellations.json';
import { groupStagesByTier } from './gameLogic';

export const STAGES = constellationData.map((c, index) => ({
  id: index + 1,
  abbr: c.id,
  name: c.name,
  nameEn: c.nameEn,
  difficulty: c.difficulty,
  stars: c.stars,
  path: c.path,
  desc: c.desc,
}));

export const TIERS = [
  { key: 'star2',    label: '2별',     color: 'emerald', difficulty: '2별' },
  { key: 'star3',    label: '3별',     color: 'teal',    difficulty: '3별' },
  { key: 'star4',    label: '4별',     color: 'sky',     difficulty: '4별' },
  { key: 'star5',    label: '5별',     color: 'blue',    difficulty: '5별' },
  { key: 'star6',    label: '6별',     color: 'indigo',  difficulty: '6별' },
  { key: 'star78',   label: '7~8별',   color: 'violet',  difficulty: '7~8별' },
  { key: 'star911',  label: '9~11별',  color: 'amber',   difficulty: '9~11별' },
  { key: 'star1214', label: '12~14별', color: 'orange',  difficulty: '12~14별' },
  { key: 'star1523', label: '15~23별', color: 'rose',    difficulty: '15~23별' },
];

export const TIER_GROUPS = groupStagesByTier(STAGES, TIERS);

export const MAX_MISTAKES = 3;
