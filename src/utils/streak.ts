/**
 * Date-based streak calculation utility.
 * Streaks advance only across consecutive calendar days, not per task.
 * Multiple tasks completed on the same date will NOT inflate the day streak.
 */

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeDateBasedStreak(
  completedDateTimestamps: string[],
  referenceDate: Date = new Date()
): { currentStreak: number; longestStreak: number } {
  if (!completedDateTimestamps || completedDateTimestamps.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Map all completion timestamps into unique local calendar date strings "YYYY-MM-DD"
  const dateSet = new Set<string>();
  for (const timestamp of completedDateTimestamps) {
    if (!timestamp) continue;
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      dateSet.add(toDateString(d));
    }
  }

  if (dateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayStr = toDateString(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateString(yesterday);

  // Check if active streak exists: user must have completed at least one task today or yesterday
  let currentStreak = 0;
  if (dateSet.has(todayStr)) {
    // Active today: count consecutive calendar days backwards starting from today
    let checkDate = new Date(referenceDate);
    while (dateSet.has(toDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (dateSet.has(yesterdayStr)) {
    // Completed yesterday, hasn't completed any yet today: streak is maintained from yesterday
    let checkDate = new Date(yesterday);
    while (dateSet.has(toDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    // Last completed task was 2 or more days ago: streak broken
    currentStreak = 0;
  }

  // Calculate all-time longest consecutive day streak from unique historical dates
  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const [py, pm, pd] = sortedDates[i - 1].split('-').map(Number);
      const [cy, cm, cd] = sortedDates[i].split('-').map(Number);
      const prevMidnight = new Date(py, pm - 1, pd).getTime();
      const currMidnight = new Date(cy, cm - 1, cd).getTime();
      const diffDays = Math.round((currMidnight - prevMidnight) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}
