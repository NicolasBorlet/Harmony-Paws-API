import {
  computeActivityOs,
  computeBadgeReward,
  computeLevel,
  osToExperience,
} from './reward.constants';

describe('reward.constants', () => {
  describe('computeActivityOs', () => {
    it('uses km and minutes with a minimum of 1', () => {
      expect(computeActivityOs(0, 0)).toBe(1);
      expect(computeActivityOs(2.5, 30)).toBe(55);
    });
  });

  describe('computeBadgeReward', () => {
    it('maps badge points to os and xp', () => {
      expect(computeBadgeReward(10)).toEqual({ points: 10, experience: 100 });
    });
  });

  describe('osToExperience', () => {
    it('converts os to xp at a 1:10 ratio', () => {
      expect(osToExperience(5)).toBe(50);
    });
  });

  describe('computeLevel', () => {
    it('returns level 1 below the first threshold', () => {
      expect(computeLevel(0)).toBe(1);
      expect(computeLevel(99)).toBe(1);
    });

    it('returns level 2 at 100 xp', () => {
      expect(computeLevel(100)).toBe(2);
    });

    it('returns higher levels at cumulative thresholds', () => {
      expect(computeLevel(250)).toBe(3);
      expect(computeLevel(1000)).toBe(5);
    });
  });
});
