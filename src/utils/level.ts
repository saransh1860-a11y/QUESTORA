export function calculateLevelData(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progressPct: number } {
  let level = 1;
  while (true) {
    const xpNeededForNext = Math.floor(100 * Math.pow(level, 1.45));
    if (totalXp < xpNeededForNext) {
      const prevLevelTotal = level === 1 ? 0 : Math.floor(100 * Math.pow(level - 1, 1.45));
      const xpInCurrentLevel = totalXp - prevLevelTotal;
      const xpRangeForLevel = xpNeededForNext - prevLevelTotal;
      const progressPct = Math.min(100, Math.max(0, Math.floor((xpInCurrentLevel / xpRangeForLevel) * 100)));

      return {
        level,
        currentLevelXp: xpInCurrentLevel,
        nextLevelXp: xpRangeForLevel,
        progressPct
      };
    }
    level++;
  }
}
